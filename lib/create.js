const join = require('path').join
const fs = require('fs')
const colors = require('colors')

function slugify (str) {
  return str.replace(/\s+/g, '-')
}

function create (options) {
  const currentPath = options.path || '.'
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const title = options.title
  const slug = slugify(title)

  if (fs.existsSync(currentPath) == false) {
    fs.mkdirSync(currentPath)
  }

  ['UP', 'DOWN'].forEach(function (direction) {
    const fileName = slug
      ? [currentTimestamp, direction, slug].join('-')
      : [currentTimestamp, direction].join('-')

    const path = join(currentPath, fileName + '.sql')

    log('create', join(process.cwd(), path))

    fs.writeFileSync(
      path,
      '-- ' + [currentTimestamp, direction, title].join(' ')
    )
  })
}

function log (key, msg) {
  console.log(colors.gray(`  ${key} :`), colors.cyan(msg))
}

module.exports = create
