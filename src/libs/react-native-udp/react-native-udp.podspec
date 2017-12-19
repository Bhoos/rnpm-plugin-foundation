require 'json';

# Assuming the library is there in node_modules
package = JSON.parse(File.read(File.join(__dir__, '../../../react-native-udp/package.json')));

Pod::Spec.new do |s|
  s.name = 'react-native-udp'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.author = package['author']

  s.source_files = "../../../react-native-udp/**/*.{h,m}"
end
