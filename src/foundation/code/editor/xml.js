/* eslint-disable no-param-reassign */
const fs = require('fs');
const xml2js = require('xml2js');

module.exports = function createXmlHandler(file) {
  let targetPath = file;
  const content = fs.readFileSync(file).toString('utf-8');

  return new Promise((resolve, reject) => {
    xml2js.parseString(content, (err, response) => {
      if (err) {
        return reject(err);
      }

      function createNode(tag, obj) {
        return {
          tag,
          getObject: () => obj,
          cloneObj: () => Object.assign({}, obj),
          get: name => obj.$[name],
          set: (name, value) => {
            if (obj.$ === undefined) {
              obj.$ = {};
            }
            obj.$[name] = value;
          },
          node: (name, index = 0) => createNode(name, obj[name][index]),
          create(name, attributes = {}) {
            const node = createNode(name, {
              $: attributes,
            });

            return this.append(node);
          },
          append(node) {
            // Check if there is already a node with the given tag name
            if (!obj[node.tag]) {
              obj[node.tag] = [];
            }

            obj[node.tag].push(node.getObject());
            return node;
          },
        };
      }

      const rootTag = Object.keys(response)[0];
      const root = createNode(rootTag, response[rootTag]);

      const generator = root;

      return resolve({
        addMethod: (name, cb) => {
          generator[name] = (...args) => {
            cb(root, ...args);
          };
        },

        getGenerator: () => generator,

        getContent() { return new xml2js.Builder().buildObject(response); },

        setTargetPath: (path) => { targetPath = path; },
        flush() { return fs.writeFileSync(targetPath, this.getContent()); },
      });
    });
  });
};
