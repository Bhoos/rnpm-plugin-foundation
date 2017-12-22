let id = 0;
const fmt = '00000000-0000-0000-0000-000000000000';

module.exports = () => {
  id += 1;
  const count = id.toString(16);
  return `${fmt.substr(0, fmt.length - count.length)}${count}`;
};
