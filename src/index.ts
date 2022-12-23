import 'dotenv/config';
import {
    Client, Intents, MessageButton, MessageActionRow, Message, MessageAttachment,
} from 'discord.js';
import '@colors/colors';
import { v4 as uuid } from 'uuid';
import tmp from 'tmp';
import Axios from 'axios';
import fs from 'fs';
import logger from './logger';
import obfuscate from './obfuscate';

// Load token from .env
const token = process.env.DISCORD_TOKEN;
const MAX_SIZE = 40000; // 40kB max size

logger.log('Bot is starting ...');

// Create Discord Bot Client
const client = new Client({
    intents: [
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    ],
    partials: ['CHANNEL'],
});

// Login using token
client.login(token);

client.once('ready', () => { // When the client is ready
    logger.log(`Logged in as ${(client.user?.tag || 'Unknown').cyan}`);
});

interface ButtonInfo {
  url: string;
  preset: string;
  tag: string;
  message: Message,
  buttonIds: string[],
}

const buttonInfos = new Map<string, ButtonInfo>();

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) {
        return;
    }

    const buttonInfo = buttonInfos.get(interaction.customId);
    if (!buttonInfo) {
        interaction.update({
            embeds: [
                {
                    title: 'Prometheus Obfuscator',
                    description: 'Something went wrong. Please try again.',
                    color: '#ff8800',
                },
            ],
            components: [],
        });
        return;
    }

    buttonInfo.buttonIds.forEach((id) => {
        buttonInfos.delete(id);
    });

    const { message } = buttonInfo;
    interaction.update({});

    // Log obfuscations
    console.log(`${(buttonInfo.tag || 'Unknown User').cyan} -> ${buttonInfo.url} @ ${buttonInfo.preset}`);

    // Update Message
    await message.edit({
        embeds: [
            {
                title: 'Prometheus Obfuscator',
                description: `🔄 Uploading your file ...\n🔄 Obfuscating your file using ${buttonInfo?.preset} Preset ...\n🔄 Downloading your file ...`,
                color: '#ff8800',
            },
        ],
        components: [],
    });

    // Download file
    const tmpFile = tmp.fileSync({ postfix: '.lua' });

    const response = await Axios({
        method: 'GET',
        url: buttonInfo.url,
        responseType: 'stream',
    });

    if (response.headers['content-length'] && Number.parseInt(response.headers['content-length'], 10) > MAX_SIZE) {
        message.edit({
            embeds: [
                {
                    title: 'Prometheus Obfuscator',
                    description: 'The max filesize for the obfuscator bot is 40KB.\nIf you want to obfuscate larger files, please use the standalone version.',
                    color: '#ff0000',
                },
            ],
            components: [],
        });
        return;
    }

    response.data.pipe(fs.createWriteStream(tmpFile.name));

    // Wait for download to complete
    try {
        await new Promise<void>((resolve, reject) => {
            response.data.on('end', () => {
                resolve();
            });

            response.data.on('error', () => {
                reject();
            });
        });
    } catch (e) {
        message.edit({
            embeds: [
                {
                    title: 'Prometheus Obfuscator',
                    description: 'Upload failed! Please try again.',
                    color: '#ff0000',
                },
            ],
            components: [],
        });
        return;
    }

    // Update Message
    await message.edit({
        embeds: [
            {
                title: 'Prometheus Obfuscator',
                description: `✅ Uploading your file ...\n🔄 Obfuscating your file using ${buttonInfo?.preset} Preset ...\n🔄 Downloading your file ...`,
                color: '#ff8800',
            },
        ],
        components: [],
    });

    let outFile;
    try {
        outFile = await obfuscate(tmpFile.name, buttonInfo.preset);
    } catch (e) {
        message.edit({
            embeds: [
                {
                    title: 'Prometheus Obfuscator',
                    description: `Obfuscation failed:\n${e}`,
                    color: '#ff0000',
                },
            ],
            components: [],
        });
        return;
    }

    // Update Message
    await message.edit({
        embeds: [
            {
                title: 'Prometheus Obfuscator',
                description: `✅ Uploading your file ...\n✅ Obfuscating your file using ${buttonInfo?.preset} Preset ...\n🔄 Downloading your file ...`,
                color: '#ff8800',
            },
        ],
        components: [],
    });

    // Update Message
    const attachment = new MessageAttachment(outFile.name, 'obfuscated.lua');
    const fileMessage = await message.channel.send({
        files: [attachment],
    });
    const url = fileMessage.attachments.first()?.url;
    if (!url) {
        message.edit({
            embeds: [
                {
                    title: 'Prometheus Obfuscator',
                    description: 'Download failed! Please try again.',
                    color: '#ff0000',
                },
            ],
            components: [],
        });
        return;
    }
    fileMessage.delete();

    await message.edit({
        embeds: [
            {
                title: 'Prometheus Obfuscator',
                description: `✅ Uploading your file ...\n✅ Obfuscating your file using ${buttonInfo?.preset} Preset ...\n✅ Downloading your file ...\n\n🔗 [Download](${url})`,
                color: '#00ff00',
            },
        ],
        components: [],
    });

    // Delete Temp files
    outFile.removeCallback();
    tmpFile.removeCallback();
});

client.on('messageCreate', async (message) => {
    if (!message.author.bot) {
        // Handle file upload
        const file = message.attachments.first()?.url;
        if (!file) {
            message.reply('Please upload a file!');
            return;
        }

        const buttonIds = new Array(3).fill(0).map(() => uuid());

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(buttonIds[0])
                    .setLabel('Weak')
                    .setStyle('SUCCESS'),
                new MessageButton()
                    .setCustomId(buttonIds[1])
                    .setLabel('Medium')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId(buttonIds[2])
                    .setLabel('Strong')
                    .setStyle('DANGER'),
            );

        const content = 'For much more options, please use the standalone version.\n\nSelect the Preset to use:';

        const msg = await message.reply({
            embeds: [{
                title: 'Prometheus Obfuscator',
                color: '#ff8800',
                description: content,
            }],
            components: [row],
        });

        buttonInfos.set(buttonIds[0], {
            url: file,
            preset: 'Weak',
            tag: message.author.tag,
            message: msg,
            buttonIds,
        });
        buttonInfos.set(buttonIds[1], {
            url: file,
            preset: 'Medium',
            tag: message.author.tag,
            message: msg,
            buttonIds,
        });
        buttonInfos.set(buttonIds[2], {
            url: file,
            preset: 'Strong',
            tag: message.author.tag,
            message: msg,
            buttonIds,
        });
    }
});
