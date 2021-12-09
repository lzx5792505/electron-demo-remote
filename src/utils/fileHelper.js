const fs = window.require("fs").promises;

const createFile = (filePath, content) => {
  return fs.writeFile(filePath, content, { encoding: "utf-8" });
};

const readFile = (filePath) => {
  return fs.readFile(filePath, { encoding: "utf-8" });
};

const writeFile = (filePath, data) => {
  return fs.writeFile(filePath, data, { encoding: "utf-8" });
};

const renameFile = (oldPath, newPath) => {
  return fs.rename(oldPath, newPath);
};

const delFile = (filePath) => {
  return fs.rm(filePath);
};

module.exports = {
  createFile,
  readFile,
  writeFile,
  renameFile,
  delFile,
};
