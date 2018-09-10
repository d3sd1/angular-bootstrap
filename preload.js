const fs = require('fs');
const path = require('path');

const appDir = path.dirname(require.main.filename);
const config = JSON.parse(fs.readFileSync(appDir + '/build-config.json', 'utf8'));
const version = config["app-version"];
const tmpPath = './tmp';
const relPath = './release';
const relVersionPath = relPath + '/' + version;

let args = {};
process.argv.forEach(function (pureArg) {
  const arg = pureArg.split('=');
  args[arg[0]] = arg[1];
});
console.log(args);


/* Declare multiple-used functions */
function cp(source, target) {
  let targetFile = target;

  //if target is a directory a new file with the same name will be created
  if ( fs.existsSync( target ) ) {
    if ( fs.lstatSync( target ).isDirectory() ) {
      targetFile = path.join( target, path.basename( source ) );
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function cpDir(source, target, firstIteration = true) {
  let files = [];

  //check if folder needs to be created or integrated
  let targetFolder = "";
  if(firstIteration) {
    targetFolder = target;
  }
  else {
    targetFolder = path.join(target, path.basename(source));
  }
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
  }

  //copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        cpDir(curSource, targetFolder, false);
      } else {
        cp(curSource, targetFolder);
      }
    });
  }
}

/* Check stuff */
if (!fs.existsSync(tmpPath)) {
  fs.mkdirSync(tmpPath);
}

/* Get icons */
const iconsDir = tmpPath + '/icons';
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}
fs.readdirSync(relVersionPath + '/web').forEach(function(file) {
  /* windows? */
  if (-1 !== file.search('.jpg') ||
    -1 !== file.search('.png') ||
    -1 !== file.search('.ico') ||
    -1 !== file.search('.icns')) {
    cp(relVersionPath + '/web/' + file, iconsDir + '/' + file);
  }
});
