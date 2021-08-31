
# Fiat to RAI
<p align="center">
  <img width="300px" style="text-align: center;" src="https://github.com/JairoFra/fiat-to-rai-chrome-extension/raw/master/images/icon_128.png">
</p>

An audio manager library for Angular.


This library is a wrapper of the Web Audio API which makes much easier interact with audio in the browser.

  

## Table of Contents

*  [Installation](#installation)

*  [Usage](#usage)




  
  

## Installation

```sh
npm install @ngx-audio-mngr --save
```

## Usage

  npm install @ngx-audio-mngr –save

#### Import the `AudioMngrModule`:

  

You have to import `AudioMngrModule` in the root NgModule of your application.

  

```ts
import {NgModule} from  '@angular/core';
import {AudioMngrModule} from  '@ngx-audio-mngr';
import { AppComponent } from  './app.component';

@NgModule({
	imports: [AudioMngrModule],
	bootstrap: [AppComponent]
})

export  class  AppModule { }
```

#### Inject and use the `AudioMngrService`:
```ts
import { AudioMngrService} from "ngx-audio-mngr";

sound: AudioMngrSound;

class AppComponent implements OnInit {
  constructor(private audioMngr: AudioMngrService) {}

  ngOnInit() {
    /** Initialize and load sound */
    this.sound.initSound('https://freesound.org/data/previews/488/488795_10350281-lq.mp3');
  }
  
  play() {
    /** Play sound */
	this.sound.play();
  }
}
```


## API  

### AudioMngrService

#### Methods:

| Name | Return type |Parameters| Description|
|-----------|-------------|-----------|------------|
| **initSound** |[AudioMngrSound](#audiomngrsound) | |Creates AudioMngrSound object and ads it to the array of sounds|

  
### AudioMngrSound

#### Properties:

| Name | Type | Description|
|-----------|-------------|-----------|
| **audio** |[AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) |Native object from the Web Audio API that represents the decoded audio data. |


#### Methods:
| Name | Return type |Parameters| Description|
|-----------|-------------|-----------|------------|
| **loadSound** |[AudioMngrSound](#audiomngrsound) | source: File \| string \| [AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer)|Loads a sound from different types sources: a file, a URL or an [AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) object.|