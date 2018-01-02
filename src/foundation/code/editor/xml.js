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

      function createNode(tagName, obj) {
        return {
          tag: tagName,
          getObject: () => obj,
          cloneObj: () => Object.assign({}, obj),
          get(attr) {
            if (!obj.$) {
              return null;
            }
            return obj.$[attr];
          },
          set(attr, value) {
            if (obj.$ === undefined) {
              obj.$ = {};
            }
            obj.$[attr] = value;
            return this;
          },
          update(attributes) {
            if (obj.$ === undefined) {
              obj.$ = {};
            }
            Object.assign(obj.$, attributes);
            return this;
          },
          nodes(tag) {
            if (!obj[tag]) {
              return [];
            }

            return obj[tag].map(n => createNode(tag, n));
          },
          nodeByName(tag, name) {
            return this.nodeBy(tag, 'android:name', name);
          },
          nodeBy(tag, attr, attrValue) {
            const node = this.node(tag, this.findIndex(tag, n => n.get(attr) === attrValue));
            node.set(attr, attrValue);
            return node;
          },
          findIndex(tag, cb) {
            if (!obj[tag]) {
              return -1;
            }

            return obj[tag].findIndex(o => cb(createNode(tag, o)));
          },
          node(tag, index = 0) {
            if (!obj[tag]) {
              obj[tag] = [];
            }

            let nObj = {};
            if (index < 0 || index >= obj[tag].length) {
              obj[tag].push(nObj);
            } else {
              nObj = obj[tag][index];
            }

            return createNode(tag, nObj);
          },
          create(tag, attributes = {}) {
            const node = createNode(tag, {
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
