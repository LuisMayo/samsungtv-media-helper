# samsungtv-media-helper 📺
 Node App that prepares a video or a series of videos to be viewable (and subtitled) in a Samsung TV through DLNA

## Getting Started

### Prerequisites
 - Node.JS environment
 - ffmpeg installation in your path. In most Linux distros it should be available in the default package manager. In Windows systems it'd include downloading a [pre-compiled zip folder](https://ffmpeg.org/download.html#build-windows), extracting it and adding the /bin folder into the [system path](https://helpdeskgeek.com/windows-10/add-windows-path-environment-variable/)

#### Optional
If you want to use the file selector you need to use one of the following OS families:
 - Windows
 - Linux
 - Mac OS

Else you will be required to provide the file via command line

### Installing

Clone the repository

```
git clone https://github.com/LuisMayo/samsungtv-media-helper
```

Install dependencies
``` bash
npm i
```

### Running
You can either provide an input file to be processed
``` bash
npm start ./breakdance.srt
```

Or you can launch it without arguments to be greeted by a file picker (only in Windows, Linux and Mac OS)
``` bash
npm start
```

## Contributing
Since this is a tiny project we don't have strict rules about contributions. Just open a Pull Request to fix any of the project issues or any improvement you have percieved on your own. Any contributions which improve or fix the project will be accepted as long as they don't deviate too much from the project objectives. If you have doubts about whether the PR would be accepted or not you can open an issue before coding to ask for my opinion.