//go:build ignore
// +build ignore

// go generate

package main

import (
  "archive/tar"
  "archive/zip"
  "fmt"
  "io"
  "net/http"
  "os"
  "os/exec"
  "path"
  "path/filepath"
  "runtime"
  "strings"
)

var downloadMap = map[string]map[string]string{
  "windows": {
    "amd64": "x86_64",
    "arm64": "aarch64",
    "386": "x86",
  },
  "darwin": {
    "amd64": "x86_64",
    "arm64": "aarch64",
  },
  "linux": {
    "amd64": "x86_64",
    "arm64": "aarch64",
    "arm": "armv7a",
    "riscv64": "riscv64",
    "ppc64le": "powerpc64le",
    "386": "x86",
    "loong64": "loongarch64",
  },
}
var zigVersion = "0.14.0-dev.2987+183bb8b08"
func getZigUrl() string {
  getFormattedUrl := func(os, arch string) string {
    postfix := "tar.xz"
    if (runtime.GOOS == "windows") {
      postfix = "zip"
    }
    return "https://ziglang.org/builds/zig-" + os + "-" + arch + "-" + zigVersion + "." + postfix
  }

  submap, ok := downloadMap[runtime.GOOS]
  if !ok {
    panic("unsupported os " + runtime.GOOS)
  }

  arch, ok := submap[runtime.GOARCH]
  if !ok {
    panic("unsupported arch " + arch)
  }

  osName := runtime.GOOS
  if osName == "darwin" {
    osName = "macos"
  }

  return getFormattedUrl(osName, arch)
}

func downloadZipToTemp() string {
  postfix := "tar.xz"
  if (runtime.GOOS == "windows") {
    postfix = "zip"
  }

  tempFilePath := path.Join(os.TempDir(), "zig_" + zigVersion + "_downloaded." + postfix)
  fmt.Println("Downloading zig to " + tempFilePath)

  outputFile, err := os.Create(tempFilePath)
  if err != nil {
    panic("error creating output file: " +  err.Error())
  }
  defer outputFile.Close()

  url := getZigUrl()
  fmt.Println("Url: " + url)
  resp, err := http.Get(url)
  if err != nil {
    panic("error downloading file: " +  err.Error())
  }
  defer resp.Body.Close()

  if resp.StatusCode != http.StatusOK {
    panic("bad status when downloading file: " +  resp.Status)
  }

  _, err = io.Copy(outputFile, resp.Body)
  if err != nil {
    panic("error copying file contents: " +  err.Error())
  }

  return tempFilePath
}

func extractZigWindows(filePath, binPath, libPath, binName string) {
  fmt.Println("Extracting zip Archive")

  zipFile, err := zip.OpenReader(filePath)
  if err != nil {
    panic("Could not open zip file: " + err.Error())
  }
  defer zipFile.Close()

  for _, file := range zipFile.File {
    if !file.FileInfo().IsDir() {
      fragments := strings.Split(file.FileInfo().Name(), string(os.PathSeparator))
      if len(fragments) < 2 {
        continue
      }

      var destPath string
      if fragments[1] == binName {
        destPath = path.Join(binPath, binName)
      } else if fragments[1] == "lib" {
        fragments[0] = libPath
        fragments[1] = "zig"
        destPath = filepath.Join(fragments...)
      } else {
        continue
      }

      if err := os.MkdirAll(path.Dir(destPath), 0755); err != nil {
        fmt.Println("Error creating directory:", err)
        continue
      }

      // Open the output file
      outputFile, err := os.Create(destPath)
      if err != nil {
        fmt.Println("Error creating output file:", err)
        continue
      }
      defer outputFile.Close()

      // Copy the file contents from the archive to the output file
      rc, err := file.Open()
      if err != nil {
        fmt.Println("Error opening file in archive:", err)
        continue
      }
      _, err = io.Copy(outputFile, rc)
      if err != nil {
        fmt.Println("Error copying file contents:", err)
        continue
      }
      rc.Close()
    }
  }
}

func unxz(filePath string) (outputFile string) {
  fmt.Println("Decompressing xz archive")

  err := exec.Command("xz", "-d", filePath).Run()
  if err != nil {
    panic("Error decompressing file: " + err.Error())
  }

  return filePath[:len(filePath)-3] // remove .xz
}

func extractZigUnix(filePath, binPath, libPath, binName string) {
  filePath = unxz(filePath)
  defer os.Remove(filePath)

  fmt.Println("Extracting tar Archive")

  tarFile, err := os.Open(filePath)
  if err != nil {
    panic("could not open tar file: " + err.Error())
  }
  defer tarFile.Close()

  tarReader := tar.NewReader(tarFile)
  for {
    header, err := tarReader.Next()
    if err == io.EOF {
      break
    }
    if err != nil {
      panic("error reading tar file: " + err.Error())
    }

    if !header.FileInfo().IsDir() {
      fragments := strings.Split(header.Name, string(os.PathSeparator))
      if len(fragments) < 2 {
        continue
      }

      var destPath string
      if fragments[1] == binName {
        destPath = path.Join(binPath, binName)
      } else if fragments[1] == "lib" {
        fragments[0] = libPath
        fragments[1] = "zig"
        destPath = filepath.Join(fragments...)
      } else {
        continue
      }

      // Create the output directory if it doesn't exist
      if err := os.MkdirAll(path.Dir(destPath), 0755); err != nil {
        fmt.Println("error creating directory:", err)
        continue
      }

      // Create the output file
      outputFile, err := os.Create(destPath)
      if err != nil {
        fmt.Println("error creating output file:", err)
        continue
      }
      defer outputFile.Close()

      _, err = io.Copy(outputFile, tarReader)
      if err != nil {
        fmt.Println("error copying file contents:", err)
        continue
      }
    }
  }
}

// return true if the command exists
func commandExists(cmd string) bool {
  _, err := exec.LookPath(cmd)
  // we dont care if its permission / notfound / isadir etc. errors
  // because if this errors, the command effectively does not exist
  return err == nil
}

func mustGetEnv(key string) string {
  value, ok := os.LookupEnv(key)
  if !ok {
    panic(key + " not found in environment")
  }
  return value
}

func installZig() (runCommand string) {
  fmt.Println("Installing Zig")

  exists := commandExists("zig")
  if (exists) {
    version, err := exec.Command("zig", "version").Output()
    if (err == nil) {
      ver := strings.SplitN(string(version), ".", 3)
      if (ver[0] == "0" && ver[1] == "14") {
        fmt.Println("zig 0.14 is already installed on the system")
        return "zig"
      }
    }
  }

  var goOs = func() int {
    if runtime.GOOS == "darwin" || runtime.GOOS == "linux" {
      return 0
    }
    if runtime.GOOS == "windows" {
      return 1
    }
    panic("unknown os " + runtime.GOOS)
  }()

  var zigBinPath string
  var zigLibPath string
  var binName string
  if (goOs == 0) { // unix (linux, darwin)
    p := path.Join(mustGetEnv("HOME"), ".local")
    zigBinPath = path.Join(p, "bin")
    zigLibPath = path.Join(p, "lib")
    binName = "zig"
  } else { // windows
    p := path.Join(mustGetEnv("USERPROFILE"), "AppData", "Local")
    zigBinPath = path.Join(p, "bin")
    zigLibPath = path.Join(p, "lib")
    binName = "zig.exe"
  }

  var binPath = path.Join(zigBinPath, binName)

  fmt.Println("Lib Location:", zigLibPath)
  fmt.Println("Bin Location:", binPath)

  binFileInfo, err := os.Stat(binPath)
  if err == nil && !binFileInfo.IsDir() {
    os.Chmod(binPath, 0755)
    fmt.Println("Zig already installed")
    return binPath
  }

  downloaded := downloadZipToTemp()
  defer os.Remove(downloaded)

  tempDir, err := os.MkdirTemp("", "zig_extract")
  defer os.RemoveAll(tempDir)
  if err != nil {
    panic("error creating temporary directory: " +  err.Error())
  }

  fmt.Println("Extracting Files")
  if (goOs == 0) { // unix (linux, darwin)
    extractZigUnix(downloaded, zigBinPath, zigLibPath, binName)
  } else { // windows
    extractZigWindows(downloaded, zigBinPath, zigLibPath, binName)
  }

  os.Chmod(binPath, 0755)
  fmt.Println("Installation successful")
  return binPath
}

// Copy file implementation
func copyFile(src, dst string) error {
  sourceFile, err := os.Open(src)
  if err != nil {
    return err
  }
  defer sourceFile.Close()

  destinationFile, err := os.Create(dst)
  if err != nil {
    return err
  }
  defer destinationFile.Close()

  _, err = io.Copy(destinationFile, sourceFile)
  if err != nil {
    return err
  }

  sourceFileInfo, err := sourceFile.Stat()
  if err != nil {
    return err
  }

  // copy the permissions as well
  _ = os.Chmod(dst, sourceFileInfo.Mode())
  // We ignore the error because this failing doesn't affect the result much

  return nil
}


// <- Zig installation impl

func main() {
  cwd, err :=  os.Getwd()
  if err != nil { panic(err) }
  fmt.Println("In Dir", cwd)

  var zigCommand string = ""


  _, err = os.Stat("libgen.a")
  if err == nil || !os.IsNotExist(err) {
    fmt.Println("libgen.a already exists")
    return
  }

  tempDir := os.TempDir()
  tempLibPath := path.Join(tempDir, "2025_ccs_prob_game_build_cache", "libgen.a")
  if _, err = os.Stat(tempLibPath); err == nil {
    err = copyFile(tempLibPath, "libgen.a")
    if err != nil {
      fmt.Println("Cant copying libgen.a from tempDir even tho it exists: " + err.Error())
    } else {
      return
    }
  }

  println("Generating markov.word model")
  _, err = os.Stat(path.Join("text_gen", "data", "markov.word"))
  if err != nil && os.IsNotExist(err) {
    if (zigCommand == "") { zigCommand = installZig() }

    err := os.Chdir("text_gen")
    if err != nil { panic(err) }
    output, err := exec.Command(zigCommand, "run", "-OReleaseFast", "-fsingle-threaded", "main.zig").CombinedOutput()
    fmt.Println(string(output))
    if err != nil { panic("Error executing command: " + err.Error()) }
    err = os.Chdir(cwd)
    if err != nil { panic(err) }
  } else {
    fmt.Println("markov.word model already exists")
  }

  println("Compiling libgen.a")
  if (zigCommand == "") { zigCommand = installZig() }

  output, err := exec.Command(zigCommand, "build-lib", "-OReleaseFast", "-fsingle-threaded", "-fstrip", "gen.zig").CombinedOutput()
  defer os.Remove("libgen.a.o")
  fmt.Println(string(output))
  if err != nil { panic("Error executing command: " + err.Error()) }

  err = os.MkdirAll(path.Join(tempDir, "2025_ccs_prob_game_build_cache"), 0755)
  if err != nil {
    fmt.Println("Error creating build cache directory: " + err.Error())
  }
  err = copyFile("libgen.a", tempLibPath)
  if err != nil {
    fmt.Println("Error copying libgen.a to tempDir: " + err.Error())
  }
}

