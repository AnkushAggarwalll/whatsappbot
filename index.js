const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const qrcode = require('qrcode-terminal');
const DownloadYTFile = require('yt-dl-playlist');
const { Client, MessageMedia } = require('whatsapp-web.js');

const downloadStatus = {}; 
const downloadedMusics = [];
const client = new Client();
const downloadPath = path.resolve(__dirname, 'downloads');

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', async () => {
    console.log('Connected succesfully');
    await fs.readdir(path.resolve(__dirname, 'downloads'), (err, itens) => {
      itens.map(item => downloadedMusics.push(item));
    });
    downloadStatus.baixando = false;
    
});

client.on('message_create', async message => {
  if(message.body.startsWith('!musicas') && message.fromMe){
    console.log(downloadedMusics);
  }

  if(message.body.startsWith('!info') && message.fromMe){
    console.log(message);
    client.sendMessage(message.to, 'kkkkk')
  }
  if(message.body.startsWith('!play')){
    const opts = {
      query: message.body.split('!play')[1],
      pageStart: 1,
      pageEnd: 3, 
    }
console.log(opts)
    const { videos } = await yts(opts);

    if (videos.length == 0) {
      return message.reply("not found");   
    }

    const { videoId, title, duration } = videos[0];
    console.log(videoId)

    if (downloadedMusics.includes(`${videoId}.mp3`)){
      media =  MessageMedia.fromFilePath(path.resolve(__dirname, 'downloads', `${videoId}.mp3`));
      return message.reply(media);   
    } else if (duration.seconds >= 900) {
      return message.reply("it should be less than 15 minutes");
    }
    if (downloadStatus.baixando == true) {
      return message.reply("Somebody somewhere in my zipzopt is already downloading a song at the moment. Wait! (or pay me a bot server)");
    }

    downloadStatus.baixando = true;
    message.reply("https://www.youtube.com/watch?v="+videoId);

    const downloader = new DownloadYTFile({ 
      outputPath: downloadPath,
      ffmpegPath: './ffmpeg/bin/ffmpeg.exe',
      maxParallelDownload: 1,
    });


    /* UNCOMMENT TO SHOW DOWNLOAD PROGRESS */
    // downloader.on('progress', (fileInfo) => { 
    //   //console.log(fileInfo.progress)
    //   const totalTime = fileInfo.ref.duration;
    //   const atualTime = fileInfo.progress.timemark;
    //   const atualSeconds = Number(atualTime.split(":")[1]*60) + Number(atualTime.split(":")[2]);
    //   client.sendMessage(message.to, `Downloading: ${(atualSeconds*100/totalTime).toFixed(0)}%`)
    // })

    const download = await downloader.download(videoId, `${videoId}.mp3`);
    if (!download){
      return message.reply("Error, please try again.");
    }

    downloadStatus.baixando = false;

    media =  MessageMedia.fromFilePath(path.resolve(__dirname, 'downloads', `${videoId}.mp3`));
    return message.reply(media);
  }
});

client.initialize();