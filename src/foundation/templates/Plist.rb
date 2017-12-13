require 'json'
require 'base64'
module Plist
  def Plist.finalParse(value)
    case value
    when Array
      return value.map { |v| finalParse(v) }
    when Hash
      if value.has_key?("##internal##")
        case value["##internal##"]
        when "string"
          return value["value"]
        when "real"
          return value["value"].to_f
        when "date"
          return Date.parse value["value"]
        when "data"
          return Base64.decode64(value["value"])
        when "integer"
          return value["value"].to_i
        when "bool"
          return value["value"]
        else
          return nil
        end
      else
        res = Hash.new
        value.each do |name, value|
          res[name] = finalParse(value)
        end
        return res
      end
    else
      return nil
    end
  end

  def Plist.parse(content)
    if (content =~ /<dict>(.*)<\/dict>/m)
      value = "#{$1}"
      commaStack = ['']

      json = value.gsub(/<([^>]*?)>/) {
        tag = $1
        case tag
        when 'key'
          next commaStack[-1] + '"'
        when '/key'
          commaStack[-1] = ':'
          next '"'
        when 'array'
          commaStack.push('')
          next commaStack[-2] + '['
        when '/array'
          commaStack.pop()
          commaStack[-1] = ','
          next ']'
        when 'dict'
          commaStack.push('')
          next commaStack[-2] + '{'
        when '/dict'
          commaStack.pop()
          commaStack[-1] = ','
          next '}'
        when 'true/', 'false/'
          c = commaStack[-1]
          commaStack[-1] = ','
          next c + "{\"##internal##\": \"bool\", \"value\": #{tag[0..-2]}}"
        else
          if tag[0] === '/'
            commaStack[-1] = ','
            next '"}'
          else
            next commaStack[-1] + "{ \"##internal##\": \"#{tag}\", \"value\": \""
          end
        end
      }


      return finalParse(JSON.parse("{#{json}}"))
    end
  end

  XmlHeader = <<String
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
String

  def Plist.toXml(obj, indent)
    p = ""
    case obj
    when Hash
      p += indent + "<dict>\n"
      obj.each do |key,value|
        p += indent + "  <key>#{key}</key>\n"
        p += toXml(value, indent + "  ")
      end
      p += indent + "</dict>\n"
    when Array
      p += indent + "<array>\n"
      obj.each do |value|
        p += toXml(value, indent + "  ")
      end
      p += indent + "</array>\n"
    when TrueClass
      p += indent + "<true/>\n"
    when FalseClass
      p += indent + "<false/>\n"
    when String
      p += indent + "<string>#{obj}</string>\n"
    when Fixnum
      p += indent + "<integer>#{obj}</integer>\n"
    when Float
      p += indent + "<real>#{obj}</real>\n"
    else
      p += indent + "<string></string>\n"
    end

    return p
  end

  def Plist.xml(obj)
    return XmlHeader + toXml(obj, "  ") + "</plist>"
  end
end

puts Plist.xml(Plist.parse(File.read('sample.plist')))
