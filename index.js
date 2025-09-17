require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, EndBehaviorType, VoiceReceiver } = require('@discordjs/voice');
const prism = require('prism-media');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'join') {
    const channel = interaction.member.voice.channel;
    if (!channel) return interaction.reply('Kamu harus berada di voice channel!');

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    interaction.reply('Bot telah join voice channel!');

    const receiver = connection.receiver;

    channel.members.forEach(member => {
      if (member.user.bot) return;

      const opusStream = receiver.subscribe(member.id, {
        end: { behavior: EndBehaviorType.Manual },
      });

      const pcmStream = new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });
      const bufferChunks = [];

      opusStream.pipe(pcmStream)
        .on('data', chunk => {
          bufferChunks.push(chunk); // simpan sementara di memory
          
          // bisa kirim tiap buffer ke Groq di sini
          // contoh: await groq.uploadChunk(Buffer.concat(bufferChunks));
          // bufferChunks.length = 0; // reset setelah dikirim
        })
        .on('end', () => {
          console.log(`Selesai menerima audio dari ${member.user.username}`);
        });
    });
  }
});

client.login(process.env.DISCORD_TOKEN);