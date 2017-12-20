require 'json'
require_relative 'Plist'

const lockFile = JSON.parse(File.read('../foundation/foundation.lock'))

RNPath = "../node_modules/react-native"

# The libraries that need to be linked by default
rnSubmodules = [
  "Core",
  "RCTActionSheet",
  "RCTBlob",
  "RCTAnimation",
  "RCTGeolocation",
  "RCTImage"
  "RCTNetwork",
  "RCTSettings",
  "RCTText",
  "RCTVibration",
  "RCTWebSocket"
]

# Check for additional react-native modules from the lockFile
rnSubmodules.concat lockFile["react-native"]["submodules"]

# Link react-native modules via pod
pod "yoga", :path => "#{RNPath}/ReactCommon/yoga"
pod "React", :path => RNPath, :subspecs => rnSubmodules

# Add all libraries for which pod files have been provided
lockFile["libraries"].each do |lib|
  lib.pods.each do |libPod|
    pod libPod.name, :path => libPod.path, :subspecs => libPod.submodules
  end
end

# Based on the given podspec path, search for
# a podspec file and install using relative path
# This will only install a core spec and the subspec
# are not installed
def addSpec(glob)
  spec = Dir.glob(glob)
  if (spec[0])
    matches = spec[0].match(/\/([^\/]*).podspec/)
    if (matches[1])
      pod matches[1], :path => spec[0]
    end
  end
end

# Load package.json file to search for dependencies
package = JSON.parse(File.read('../package.json'))
packageRN = package["foundation"]["rn"]
packageLib = package["foundation"]["lib"]

package["dependencies"].each do |name, version|
  if name == "react" || name == "react-native"
    # No need to add dependencies
  else
    # Search for pod specification within the folder
    addSpec("../node_modules/#{name}/*.podspec")
    addSpec("../node_modules/#{name}/ios/*.podspec")
  end
end

def getSymbols() {
  symbols = Hash.new
  def flatten(source, prefix)
    source.each do |name, value|
      if (value.class == Hash && value["ios"])
        value = value["ios"]
      end

      key = "#{prefix}#{name}"
      if (value.class == Hash)
        flatten(value, "#{key}/")
      else
        symbols[key] = value
      end
    end
  end

  flatten(packageRN), "rn/");
  flatten(packageLib, "");
  return symbols;
}

# setup a post install hook to
# Add a post install hook to setup the plist file
# Also include build configurations
post_install do |installer|
  plist = Plist.parse(File.read('RNFoundation-Info.plist'))
  entitlements = Plist.parse(File.read('RNFoundation-Entitlements.plist'))

  # Get ios specific symbols
  symbols = getSymbols()

  # create target from original
  ORIG_PLIST = File.read('{{project}}/Info.plist')
  open(TARGET_PLIST, 'w') do |f|
    f << ORIG_PLIST.gsub(/{{(.*)}}/) { symbols [$1] }
  end

  # See if Linking needs to be included
  if (packageRN["Linking"])
    pods "React", :path => RNPath, :subspecs => ["RCTLinking"]

    domains = entitlements['com.apple.developer.associated-domains'] || = []
    urlTypes = plist['CFBundleURLTypes'] ||= []

    # Add entitlements
    packageRN["Linking"]["urls"].each do |url|
      if url =~ /(.*)\/\/(.*)\/.*/
        scheme = $1
        domain = $2
        if (scheme == 'https')
          domains << "applinks:#{domain}"
        elsif (scheme == 'http')
          puts "While using universal links its not safe to use `http` schemes. #{url}"
          domains << "applinks:#{domain}"
        else
          urlTypes << { "CFBundleURLName" => domain, "CFBundleURLSchemes" => [ scheme ]}
        end
      else
        puts "Invalid url for Linking #{url}"
      end
    end
  end

  if (packageRN["CameraRoll"]) {
    pods "React", :path => RNPath, :subspecs => ["RCTCameraRoll"]
  }

  # merge in all the plist files
  package["dependencies"].each do |name, version|
    plistFile = Dir.glob('../node_modules/#{name}/**/RNFoundation-Info.plist')

    # found a plist file, merge it to our target
    if (plistFile[0])

      # Use a temporary file to replace all user defined symbols from our package
      tmp = TempFile.new('rn-foundation')
      begin
        tmp << File.read(plistFile[0]).gsub(/{{(.*)}}/) { symbols[$1] }
        tmp.close

        # Merge into the final plist
        plist.merge(tmp.name)
      ensure
        tmp.delete
      end
    end
  end
end
