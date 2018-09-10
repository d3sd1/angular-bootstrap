const fs = require('fs');
const path = require('path');

/* Get parameters and data */
let args = {};
process.argv.forEach(function (pureArg) {
  const arg = pureArg.split('=');
  args[arg[0]] = arg[1];
});

/* Check arch */
let arch = "";
if(args.hasOwnProperty("arch")){
  arch = args["arch"] + "/";
}

const appDir = path.dirname(require.main.filename);
const config = JSON.parse(fs.readFileSync(appDir + '/build-config.json', 'utf8'));
const version = config["app-version"];
const tmpPath = './tmp';
const relPath = './release';
const relVersionPath = relPath + '/' + version;

/* Check if we built an app previously */
if (!fs.existsSync(tmpPath)) {
  console.error("BUILD WEB BEFORE BUILDING APPS!");
  return false;
}

/* Generate releases path if neeeded */
if (!fs.existsSync(relPath)) {
  fs.mkdirSync(relPath);
}
if (!fs.existsSync(relVersionPath)) {
  fs.mkdirSync(relVersionPath);
}

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

function chkPath(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }

}

function rm(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file, index) {
      const curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        rm(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

/* Move compiled to it's right location */
let isExecutable = false;
fs.readdirSync(tmpPath).forEach(function(file) {
  /* windows? */
  if (-1 !== file.search('.exe')) {
    isExecutable = true;
    const oldFile = tmpPath + "/" + file;
    const newPath = relVersionPath + '/windows/';
    const archPath = newPath + arch;
    const newFile = archPath + config["app-name"] + '.exe';

    if (!fs.existsSync(newPath)) {
      fs.mkdirSync(newPath);
    }

    if (!fs.existsSync(archPath)) {
      fs.mkdirSync(archPath);
    }

    rm(archPath);
    chkPath(archPath);
    cp(oldFile, newFile);
  }
});

/* if no executable, it's web */
if (!isExecutable) {
  const oldPath = tmpPath + "/";
  const newPath = relVersionPath + "/web/";
  rm(newPath);
  chkPath(newPath);
  cpDir(oldPath, newPath);
}

//TODO: quie al compilar para los do windows por ejemplo no se compile 4 veces la pagina (web)
