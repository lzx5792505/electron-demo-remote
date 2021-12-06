const fs = window.require("fs").promises;

const readFile = (filePath) => {
  return fs.readFile(filePath, { encoding: "utf-8" });
};

const writeFile = (filePath, data) => {
  return fs.writeFile(filePath, data, { encoding: "utf-8" });
};

const createFile = (filePath, content) => {
  return fs.writeFile(filePath, content, { encoding: "utf-8" });
};

const renameFile = (oldPath, newPath) => {
  return fs.rename(oldPath, newPath);
};

const deleteFile = (filePath) => {
  return fs.rm(filePath);
};

module.exports = {
  renameFile,
  createFile,
  deleteFile,
  readFile,
  writeFile,
};
