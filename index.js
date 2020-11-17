//console.log(process.env.DISCORD);

const Discord = require("discord.js");
const client = new Discord.Client();

client.on("ready", () => {
  console.log("running as " + client.user.tag);
  client.user.setActivity("-help", { type: "PLAYING" });
});
var guildid = null;
client.on("guildcreate", (data) => {
  guildiD = data.id;
});
client.on("message", (msg) => {
  const txt = msg.content;
  if (txt.startsWith("-say ")) {
    msg.channel.send(txt.split("-say ")[1]);
  } else if (txt.startsWith("-help")) {
    msg.channel.send(
      "```Hi. This is a discord bot meant to help add some additional features to your server.\n\n🛠️Moderation\t\t❓Poll\t\t\t🎲Miscellaneous\n-mod help\t\t\t-poll help\t\t-misc help```"
    );
  } else if (txt.startsWith("-mod help")) {
    msg.channel.send(
      "```Moderation includes adding/removing roles for a person, creating/deleting roles, manage members. In order to use these commands, type the phrase you want and replace the parenthesis with the name.\n\n-create role (role name)\t\t\t\tCreate a new role in the server.\n-delete role (role name)\t\t\t\tDeletes an existing role in the server\n-add role @(person)\t\t\t\t\t Asks you what role to add a specific person\n-remove role @(person)\t\t\t\t  Asks you what role to remove from a certain person\n-kick @(person)\t\t\t\t\t\t Kicks a person from the server\n-ban @(person)\t\t\t\t\t\t  Bans a person from the server\n-mute @(person)\t\t\t\t\t\t Mutes a person in the server from sending messages\n-create text channel (name)\t\t\t Creates a new text channel in the server\n-create voice channel (name)\t\t\tCreates a new voice channel in the server```"
    );
  } else if (txt.startsWith("-poll help")) {
    msg.channel.send(
      "```Manage polls.\n\n-create poll (poll description)\t\t\t\tCreates a new poll\n```"
    );
    msg.delete();
  } else if (txt.startsWith("-misc help")) {
    msg.channel.send(
      "```Miscellaneous Commands\n\n-roll die\t\t\t\t\t\t\t\t Rolls a 6-sided die\n-flip coin\t\t\t\t\t\t\t\tFlips a coin\n-spam (textchannel)\t\t\t\t\t   Goes to a text channel and spams. Useful for pranks\n-say (text)\t\t\t\t\t\t\t   Makes the bot say what you want\n-member count\t\t\t\t\t\t\t Tells you how many members are in the server```"
    );
  } else if (txt.startsWith("-create poll")) {
    msg.channel.send(txt.split("-create poll ")[1]).then((m) => {
      m.react("👍");
      m.react("👎");
      m.react("❓");
    });
    msg.delete();
  } else if (txt.startsWith("-create role ")) {
    if (msg.member.hasPermission("MANAGE_ROLES")) {
      var name = txt.split("-create role ")[1];
      const guild = msg.guild;
      msg.channel.send("What color do you want the role to be?");
      const collector = new Discord.MessageCollector(
        msg.channel,
        (m) => m.author.id === msg.author.id,
        { time: 100000 }
      );
      collector.on("collect", (message) => {
        const colorval = message.content.toUpperCase();
        if (
          colorval == "BLUE" ||
          colorval == "GREEN" ||
          colorval == "RED" ||
          colorval == "ORANGE" ||
          colorval == "YELLOW" ||
          colorval == "PINK" ||
          colorval == "PURPLE"
        ) {
          guild.roles.create({
            data: {
              name: name,
              color: colorval,
            },
          });
          msg.channel.send("The role " + name + " has been created");
          msg.channel.send("Color set to " + colorval);
          collector.stop();
        } else {
          guild.roles.create({
            data: {
              name: name,
              color: "GREEN",
            },
          });
          msg.channel.send(
            "Not a valid color- The role has been set to default GREEN."
          );
          collector.stop();
        }
      });
    } else {
      msg.channel.send(
        "You do not have permission to manage roles in this server."
      );
    }
  } else if (txt.startsWith("-delete role ")) {
    if (msg.member.hasPermission("MANAGE_ROLES")) {
      const name = txt.split("-delete role ")[1];
      const guild = msg.guild;
      let myRole = msg.guild.roles.cache.find((x) => x.name === name);
      if (myRole != undefined) {
        myRole.delete();
        msg.channel.send("The role " + name + " has been deleted");
      } else {
        msg.channel.send("Could not find the role you requested.");
      }
    } else {
      msg.channel.send(
        "You do not have permission to manage roles in this server."
      );
    }
  } else if (txt.startsWith("-kick ")) {
    if (msg.member.hasPermission("KICK_MEMBERS")) {
      const member = msg.mentions.members.first();
      const name = member.user.username;
      member.kick();
      msg.channel.send(name + " has been kicked from the server");
    } else {
      msg.channel.send("You do not have permission to kick people");
    }
  } else if (txt.startsWith("-ban ")) {
    if (msg.member.hasPermission("BAN_MEMBERS")) {
      const member = msg.mentions.members.first();
      const name = member.user.username;
      member.ban();
      msg.channel.send(name + " has been banned from the server");
    } else {
      msg.channel.send("You do not have permission to ban people.");
    }
  } else if (txt.startsWith("-info ")) {
    const member = msg.mentions.members.first();
    console.log(member.user.username);
  } else if (txt.startsWith("-add role ")) {
    if (msg.member.hasPermission("MANAGE_ROLES")) {
      const member = msg.mentions.members.first();
      const textvalues = txt.split("-add role ")[1].split(" ");
      //const guild = msg.guild;
      msg.channel.send(
        "What role do you want to add to " + member.user.username + "?"
      );
      const collector2 = new Discord.MessageCollector(
        msg.channel,
        (m) => m.author.id === msg.author.id,
        { time: 100000 }
      );
      collector2.on("collect", (message) => {
        const guild = msg.guild;
        const rolename = message.content;
        const role = guild.roles.cache.find((role) => role.name === rolename);
        if (role != undefined) {
          member.roles.add(role);
          msg.channel.send(
            "The role has been added to " + member.user.username
          );
        } else {
          msg.channel.send("Cannot find the role you requested");
        }
        collector2.stop();
      });
    } else {
      msg.channel.send(
        "You do not have permission to change roles for someone"
      );
    }
  } else if (txt.startsWith("-remove role ")) {
    if (msg.member.hasPermission("MANAGE_ROLES")) {
      const member = msg.mentions.members.first();
      const textvalues = txt.split("-remove role ")[1].split(" ");
      //const guild = msg.guild;
      msg.channel.send(
        "What role do you want to remove from " + member.user.username + "?"
      );
      const collector2 = new Discord.MessageCollector(
        msg.channel,
        (m) => m.author.id === msg.author.id,
        { time: 100000 }
      );
      collector2.on("collect", (message) => {
        const guild = msg.guild;
        const rolename = message.content;
        const role = guild.roles.cache.find((role) => role.name === rolename);
        if (role != undefined) {
          member.roles.remove(role);
          msg.channel.send(
            "The role has been removed from " + member.user.username
          );
        } else {
          msg.channel.send("Cannot find the role you requested");
        }
        collector2.stop();
      });
    } else {
      msg.channel.send(
        "You do not have permission to change roles for someone"
      );
    }
  } else if (txt.startsWith("-mute ")) {
    if (msg.member.hasPermission("MANAGE_ROLES")) {
      const guild = msg.guild;
      const rolename = "Muted";
      const member = msg.mentions.members.first();
      const role = guild.roles.cache.find((role) => role.name === rolename);
      if (role != undefined) {
        member.roles.add(role);
      } else {
        guild.roles.create({
          data: {
            name: rolename,
          },
        });
        member.roles.add(role);
      }
      const muterole = guild.roles.cache.find((role) => role.name === "MUTED");

      guild.channels.cache.forEach(async (channel, id) => {
        await channel.overwritePermissions([
          {
            id: member.id,
            deny: ["SEND_MESSAGES"],
          },
        ]);
      });
      msg.channel.send(member.user.username + " is now muted in this server");
    } else {
      msg.channel.send("You do not have permission to use this command");
    }
  } else if (txt.startsWith("-unmute ")) {
    if (msg.member.hasPermission("MANAGE_ROLES")) {
      const guild = msg.guild;
      const rolename = "Muted";
      const member = msg.mentions.members.first();
      const role = guild.roles.cache.find((role) => role.name === rolename);
      if (role != undefined) {
        member.roles.remove(role);
      } else {
        guild.roles.create({
          data: {
            name: rolename,
          },
        });
      }

      guild.channels.cache.forEach(async (channel, id) => {
        await channel.overwritePermissions([
          {
            id: member.id,
            allow: ["SEND_MESSAGES"],
          },
        ]);
      });
      msg.channel.send(member.user.username + " is now unmuted in this server");
    } else {
      msg.channel.send("You do not have permission to use this command.");
    }
  } else if (txt.startsWith("-create text channel ")) {
    if (msg.member.hasPermission("MANAGE_CHANNELS")) {
      const name = txt.split("-create text channel ")[1];
      msg.guild.channels.create(name, { reason: "New Channel" });
      msg.channel.send("The text channel " + name + " has been created.");
    } else {
      msg.channel.send("You do not have permission to use this command");
    }
  } else if (txt.startsWith("-create voice channel ")) {
    if (msg.member.hasPermission("MANAGE_CHANNELS")) {
      const name = txt.split("-create voice channel ")[1];
      msg.guild.channels.create(name, { type: "voice" });
      msg.channel.send("The voice channel " + name + " has been created.");
    } else {
      msg.channel.send("You do not have permission to use thi command");
    }
  } else if (
    txt.startsWith("-roll die") ||
    txt.startsWith("-roll dice") ||
    txt.startsWith("-dice roll") ||
    txt.startsWith("-die roll")
  ) {
    var num = parseInt(Math.random() * 6) + 1;
    msg.channel.send("Dice Roll: " + num);
  } else if (txt.startsWith("-flip coin") || txt.startsWith("-coin flip")) {
    var num = parseInt(Math.random() * 2) + 1;
    var word = num == 1 ? "Coin Flip: Heads" : "Coin Flip: Tails";
    msg.channel.send(word);
  } else if (txt.startsWith("-spam ")) {
    if (msg.member.hasPermission("MANAGE_ROLES")) {
      const ch = msg.mentions.channels.first();
      var spamcommand = "";
      for (var i = 0; i < 1000; i++) {
        spamcommand += "HI";
      }
      ch.send(spamcommand);
      ch.send(spamcommand);
      ch.send(spamcommand);
      ch.send(spamcommand);
    } else {
      msg.channel.send("You do not have permission to use this command");
    }
  } else if (txt.startsWith("-member count")) {
    const value = msg.guild.memberCount;
    msg.channel.send("Number of people: " + value);
  }
});
client.login(process.env.TOKEN);
