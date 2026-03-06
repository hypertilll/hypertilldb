function insertAfterAnchor(contents, anchor, insertion) {
  if (!contents.includes(anchor) || contents.includes(insertion.trim())) {
    return contents
  }

  return contents.replace(anchor, `${anchor}\n${insertion}`)
}

module.exports = {
  insertAfterAnchor,
}
