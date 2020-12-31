const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const Youtube = require("simple-youtube-api");
const { google } = require("googleapis");
var opusscript = require("opusscript");
const client = new Discord.Client();
const fetch = require("node-fetch");
const moment = require("moment");
const Users = require("./Member.js");
const firebase = require("firebase/app");
const fs = require("fs");
require("firebase/database");

var firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
};

firebase.initializeApp(firebaseConfig);
var database = firebase.database();

const APIKEY = "";
const youtube = new Youtube(APIKEY);

var guildid;
//creates a JSON object of the server stats
var serverinfo = {
  name: "",
  membercount: "",
  imageurl: "",
  id: "",
};
var usersjson = {};

//music variables
var playing = false;
var currentSong;
var songconnection;
var voiceChannel;
var cn;
var streamOptions = { seek: 0, volume: 0.8 };
var queue = [];

client.on("ready", () => {
  console.log("running as " + client.user.tag);
  console.log("Number of servers: " + client.guilds.cache.size);
  //Sets the status of the bot to "Playing -help" and sets the username of "Aqualius"
  client.user.setActivity("-help", { type: "PLAYING" });
  client.user.setUsername("Aqualius");

  //checks every hour if it's the birthday of someone
  setInterval(function () {
    database
      .ref("users/")
      .once("value")
      .then((snapshot) => {
        var people = {};
        people = snapshot.forEach(function (childref) {
          const userbday = childref.val().info.stats;

          //checks if the current date is the birthday
          if (
            moment().date() == userbday.date &&
            moment().month() + 1 == userbday.month
          ) {
            //checks if the bot already messaged "Happy Birthday"
            if (!userbday.messagedalready) {
              //makes sure the bot doesn't ping everyone at 1:00 AM
              if (moment().hour() > 8) {
                for (var attribute in childref.val().servers) {
                  //checks for the channel "Birthdays" text channel in the server
                  const guildtomessage = client.guilds.cache.get(attribute);
                  var channeltomessage;

                  guildtomessage.channels.cache.forEach((channel, id) => {
                    if (channel.name == "birthdays") {
                      channeltomessage = channel;
                    }
                  });
                  channeltomessage.send("@everyone");
                  channeltomessage.send(
                    embed(
                      "🎉🎉🎂🎂  BIRTHDAY  🎂🎂🎉🎉",
                      "\nIt's " +
                        childref.val().info.stats.name +
                        "'s birthday today!!!"
                    )
                  );
                  database
                    .ref("users/")
                    .child(childref.val().info.stats.id)
                    .child("info")
                    .child("stats")
                    .set({
                      messagedalready: true,
                      name: childref.val().info.stats.name,
                      month: childref.val().info.stats.month,
                      id: childref.val().info.stats.id,
                      date: childref.val().info.stats.date,
                    });
                }
              }
            }
          } else {
            if (childref.val().info.stats.messagedalready) {
              database
                .ref("users/")
                .child(childref.val().info.stats.id)
                .child("info")
                .child("stats")
                .set({
                  messagedalready: false,
                  name: childref.val().info.stats.name,
                  month: childref.val().info.stats.month,
                  id: childref.val().info.stats.id,
                  date: childref.val().info.stats.date,
                });
            }
          }
        });
      });
  }, 3600000);
});

//handles all the messages
client.on("message", (msg) => {
  const guildid = msg.guild.id;
  const authorid = msg.author.id;

  if (msg.author.bot) return;

  //checks if user data is already in the database
  database
    .ref("users/")
    .child(authorid)
    .child("info")
    .once("value")
    .then((snapshot) => {
      if (!snapshot.val()) {
        var newmember = new Users.Member(msg.author.username, msg.author.id);
        database.ref("users/").child(authorid).child("info").set({
          stats: newmember,
        });
        console.log(newmember);
      }
    });
  //checks if the server is added to the user's servers
  database
    .ref("users/")
    .child(authorid)
    .child("servers")
    .child(guildid)
    .once("value")
    .then((snapshot) => {
      if (!snapshot.val()) {
        database
          .ref("users/")
          .child(authorid)
          .child("servers")
          .child(guildid)
          .set({
            name: serverinfo.name,
          });
      }
    });

  //initializes JSON serverinfo stats
  serverinfo.imageurl = msg.guild.iconURL();
  serverinfo.name = msg.guild.name;
  serverinfo.id = msg.guild.id;
  serverinfo.membercount = msg.guild.memberCount;

  //creates birthday channel
  var channelexists = false;
  msg.guild.channels.cache.forEach((channel, id) => {
    if (channel.name == "birthdays") {
      channelexists = true;
    }
  });

  if (!channelexists) {
    msg.guild.channels.create("Birthdays", {
      reason: "Needed birthdays channel",
    });
  }

  //handles commands
  const txt = msg.content;
  if (txt.startsWith("-say ")) {
    msg.channel.send(txt.split("-say ")[1]);
  } else if (txt.startsWith("-help")) {
    //help command
    const embedmsg = new Discord.MessageEmbed()
      .setTitle("**HELP**")
      .setDescription(
        "Hi. This is a discord bot meant to help add some additional features to your server."
      )
      .addField((name = "\n\u200b"), (value = "\n\u200b"))
      .addFields(
        { name: "🛠️Moderation", value: "-mod help", inline: true },
        { name: "❓Poll", value: "-poll help", inline: true }
      )
      .addField((name = "\n\u200b"), (value = "\n\u200b"))
      .addFields(
        { name: "🎲Miscellaneous", value: "-misc help", inline: true },
        { name: "🎵Music", value: "-music help", inline: true }
      )
      .setColor("ORANGE");
    msg.channel.send(embedmsg);
  } else if (txt.startsWith("-mod help")) {
    //moderation help
    msg.channel.send(
      "```Moderation includes adding/removing roles for a person, creating/deleting roles, manage members. In order to use these commands, type the phrase you want and replace the parenthesis with the name.\n\n-create role (role name)\t\t\t\tCreate a new role in the server.\n-delete role (role name)\t\t\t\tDeletes an existing role in the server\n-add role @(person)\t\t\t\t\t Asks you what role to add a specific person\n-remove role @(person)\t\t\t\t  Asks you what role to remove from a certain person\n-kick @(person)\t\t\t\t\t\t Kicks a person from the server\n-ban @(person)\t\t\t\t\t\t  Bans a person from the server\n-mute @(person)\t\t\t\t\t\t Mutes a person in the server from sending messages\n-create text channel (name)\t\t\t Creates a new text channel in the server\n-create voice channel (name)\t\t\tCreates a new voice channel in the server```"
    );
  } else if (txt.startsWith("-poll help")) {
    //poll help
    msg.channel.send(
      "```Manage polls.\n\n-create poll (poll description)\t\t\t\tCreates a new poll\n```"
    );
  } else if (txt.startsWith("-misc help")) {
    //miscellaneous commands help
    msg.channel.send(
      "```Miscellaneous Commands\n\n-roll die\t\t\t\t\t\t\t\t Rolls a 6-sided die\n-flip coin\t\t\t\t\t\t\t\tFlips a coin\n-spam (textchannel)\t\t\t\t\t   Goes to a text channel and spams. Useful for pranks\n-say (text)\t\t\t\t\t\t\t   Makes the bot say what you want\n-info (user)\t\t\t\t\t\t\t  Gives detailed statistics about a user\n-server info\t\t\t\t\t\t\t  Gives info about the server\n-birthday (MM/DD/YY)\t\t\t\t\t  Sets the user's birthday```"
    );
  } else if (txt.startsWith("-music help")) {
    //music help
    msg.channel.send(
      "```Music Commands\n\n-play (url)\t\t\t\t\t\t\t\tPlays music from a url\n-play (keyword)\t\t\t\t\t\t\tSearches youtube and plays music\n-stop\t\t\t\t\t\t\t\t\t  Stops the music\n-skip\t\t\t\t\t\t\t\t\t  Skips the current song```"
    );
  } else if (txt.startsWith("-create poll")) {
    //creates a poll and reacts to it
    msg.channel.send(embed("Poll", txt.split("-create poll ")[1])).then((m) => {
      m.react("👍");
      m.react("👎");
      m.react("❓");
    });
    //deletes original user message to make it neater
    msg.delete();
  } else if (txt.startsWith("-create role ")) {
    //creates a role
    //checks for user permissions
    if (msg.member.hasPermission("MANAGE_ROLES")) {
      var name = txt.split("-create role ")[1];
      const guild = msg.guild;

      //asks for the color of the role
      msg.channel.send(
        embed("Choose Color", "What color do you want the role to be?")
      );

      //timeout for 100000 ms
      const collector = new Discord.MessageCollector(
        msg.channel,
        (m) => m.author.id === msg.author.id,
        { time: 100000 }
      );

      collector.on("collect", (message) => {
        //asks
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
          msg.channel.send(
            embed(
              "Success",
              "The role " +
                name +
                " has been created. The color set to " +
                colorval
            )
          );
          collector.stop();
        } else {
          //no color is chosen
          //sets default color to green
          guild.roles.create({
            data: {
              name: name,
              color: "GREEN",
            },
          });
          msg.channel.send(
            embed(
              "Partially Successful",
              "Not a valid color- The role has been created and set to default GREEN."
            )
          );
          collector.stop();
        }
      });
    } else {
      msg.channel.send(
        embed(
          "Failed",
          "You do not have permission to manage roles in this server."
        )
      );
    }
  } else if (txt.startsWith("-delete role ")) {
    if (msg.member.hasPermission("MANAGE_ROLES")) {
      const name = txt.split("-delete role ")[1];
      const guild = msg.guild;
      let myRole = msg.guild.roles.cache.find((x) => x.name === name);
      if (myRole != undefined) {
        myRole.delete();
        msg.channel.send(
          embed("Success", "The role " + name + " has been deleted")
        );
      } else {
        msg.channel.send(
          embed("Failed", "Could not find the role you requested.")
        );
      }
    } else {
      msg.channel.send(
        embed(
          "Failed",
          "You do not have permission to manage roles in this server."
        )
      );
    }
  } else if (txt.startsWith("-kick ")) {
    if (msg.member.hasPermission("KICK_MEMBERS")) {
      const member = msg.mentions.members.first();
      const name = member.user.username;
      member.kick();
      msg.channel.send(
        embed("Success", name + " has been kicked from the server")
      );
    } else {
      msg.channel.send(
        embed("Failed", "You do not have permission to kick people")
      );
    }
  } else if (txt.startsWith("-ban ")) {
    if (msg.member.hasPermission("BAN_MEMBERS")) {
      const member = msg.mentions.members.first();
      const name = member.user.username;
      member.ban();
      msg.channel.send(
        embed("Success", name + " has been banned from the server")
      );
    } else {
      msg.channel.send(
        embed("Failed", "You do not have permission to ban people.")
      );
    }
  } else if (txt.startsWith("-info ")) {
    const member = msg.mentions.members.first();
    var userrank;
    const createdDate = member.user.createdAt;
    const joinedDate = member.joinedAt;

    const createdDateFormatted = moment(createdDate).format("MM/DD/YY");
    const joinedDateFormatted = moment(joinedDate).format("MM/DD/YY");
    const infoembed = new Discord.MessageEmbed()
      .setTitle("**USER INFO**")
      .setDescription(member.user.username + " stats\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬")
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: "ID:", value: member.id, inline: true },
        { name: "TAG:", value: member.user.tag, inline: true }
      )
      .addField("** **", "** **", false)
      .addFields(
        {
          name: "ACCOUNT CREATED: ",
          value: createdDateFormatted,
          inline: true,
        },
        { name: "JOINED DATE: ", value: joinedDateFormatted, inline: true }
      )
      .addField("** **", "** **", false)
      .addField("Highest Role: ", member.roles.highest, true)
      .addField("** **", "** **", false)
      .setColor("ORANGE");

    //checks if MEE6 is in the server
    if (
      msg.guild.members.cache.filter(function (i) {
        i.id = "159985870458322944";
      })
    ) {
      //fetches user rank with MEE6 API
      fetch("https://mee6.xyz/api/plugins/levels/leaderboard/" + msg.guild.id)
        .then((res) => res.json())
        .then((body) => {
          userrank = body.players.filter(function (i) {
            return i.id == member.id;
          })[0].level;
          userxp = body.players.filter(function (i) {
            return i.id == member.id;
          })[0].xp;
          infoembed.addField("MEE6 Level: ", userrank, true);
          infoembed.addField("MEE6 XP: ", userxp, true);
          msg.channel.send(infoembed);
        });
    } else {
      msg.channel.send(infoembed);
    }
  } else if (txt.startsWith("-server info")) {
    //fetches all the data from the serverinfo JSON object initialized at the start
    const serverinfoembed = new Discord.MessageEmbed()
      .setTitle("Server Info")
      .setDescription(serverinfo.name + "\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬")
      .setThumbnail(serverinfo.imageurl)
      .addField("Member Count: ", serverinfo.membercount, true);
    msg.channel.send(serverinfoembed);
  } else if (txt.startsWith("-add role ")) {
    if (msg.member.hasPermission("MANAGE_ROLES")) {
      const member = msg.mentions.members.first();
      const textvalues = txt.split("-add role ")[1].split(" ");
      //const guild = msg.guild;
      msg.channel.send(
        embed(
          "Choose Role",
          "What role do you want to add to " + member.user.username + "?"
        )
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
            embed(
              "Success",
              "The role has been added to " + member.user.username
            )
          );
        } else {
          msg.channel.send(
            embed("Failed", "Cannot find the role you requested")
          );
        }
        collector2.stop();
      });
    } else {
      msg.channel.send(
        embed(
          "Failed",
          "You do not have permission to change roles for someone"
        )
      );
    }
  } else if (txt.startsWith("-remove role ")) {
    if (msg.member.hasPermission("MANAGE_ROLES")) {
      const member = msg.mentions.members.first();
      const textvalues = txt.split("-remove role ")[1].split(" ");
      //const guild = msg.guild;
      msg.channel.send(
        embed(
          "Choose role",
          "What role do you want to remove from " + member.user.username + "?"
        )
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
            embed(
              "Success",
              "The role has been removed from " + member.user.username
            )
          );
        } else {
          msg.channel.send(
            embed("Failed", "Cannot find the role you requested")
          );
        }
        collector2.stop();
      });
    } else {
      msg.channel.send(
        embed(
          "Failed",
          "You do not have permission to change roles for someone"
        )
      );
    }
  } else if (txt.startsWith("-create text channel ")) {
    if (msg.member.hasPermission("MANAGE_CHANNELS")) {
      const name = txt.split("-create text channel ")[1];
      msg.guild.channels.create(name, { reason: "New Channel" });
      msg.channel.send(
        embed("Success", "The text channel " + name + " has been created.")
      );
    } else {
      msg.channel.send(
        embed("Failed ", "You do not have permission to use this command")
      );
    }
  } else if (txt.startsWith("-create voice channel ")) {
    if (msg.member.hasPermission("MANAGE_CHANNELS")) {
      const name = txt.split("-create voice channel ")[1];
      msg.guild.channels.create(name, { type: "voice" });
      msg.channel.send(
        embed("Success", "The voice channel *" + name + "* has been created.")
      );
    } else {
      msg.channel.send(
        embed("Failed", "You do not have permission to use this command")
      );
    }
  } else if (
    txt.startsWith("-roll die") ||
    txt.startsWith("-roll dice") ||
    txt.startsWith("-dice roll") ||
    txt.startsWith("-die roll")
  ) {
    var num = parseInt(Math.random() * 6) + 1;
    msg.channel.send(embed("Dice Roll", num));
    msg.channel.send("Dice Roll: " + num);
  } else if (txt.startsWith("-flip coin") || txt.startsWith("-coin flip")) {
    var num = parseInt(Math.random() * 2) + 1;
    var word = num == 1 ? "Heads" : "Tails";
    msg.channel.send(embed("Coin Flip", word));
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
  } else if (txt.startsWith("-play")) {
    var url = txt.split("-play")[1];

    //checks if the url or keyword is empty
    if (url.trim().length == 0) {
      return;
    }

    streamOptions = { seek: 0, volume: 1 };
    voiceChannel = msg.member.voice.channel;
    //checks if user is in a voice channel
    if (voiceChannel) {
      //joins the user's voice channel
      voiceChannel
        .join()
        .then((connection) => {
          cn = connection;
          console.log("joined channel");

          //Searched youtube for the keyword and returns the first link
          youtube.searchVideos(url, 10).then((results) => {
            url = results[0].url;
            msg.channel.send(
              embed(
                "Success",
                "[" +
                  results[0].title +
                  "](" +
                  url +
                  ") has been added to the queue by " +
                  msg.author.username +
                  ".\n\nShoutout to Abhiram for helping me"
              )
            );
            queue.push(url);
            console.log("Determined URL and added to queue");
            console.log(results[0].title);
            console.log(results[0]);
            //checks if a song is currently playing
            if (!playing) {
              songconnection = play(
                queue,
                voiceChannel,
                connection,
                streamOptions
              );
            }
          });
        })
        .catch((err) => console.log(err));
    } else {
      msg.channel.send(
        embed("Failed", "You need to be in a channel to use this command")
      );
    }
  } else if (txt.startsWith("-stop")) {
    //checks if user is in a voice channel
    if (msg.member.voice.channel && songconnection) {
      stop(msg, voiceChannel);
    } else {
      msg.channel.send(
        embed(
          "Failed",
          "You need to be in the voice channel with the bot to use this command"
        )
      );
    }
  } else if (txt.startsWith("-skip")) {
    //checks if user is in a voice channel and music is playing
    if (songconnection && msg.member.voice.channel) {
      skip(msg, songconnection, queue, voiceChannel, cn, streamOptions);
    } else {
      msg.channel.send(
        embed(
          "Failed",
          "You need to be in the voice channel with the bot to use this command"
        )
      );
    }
  } else if (txt.startsWith("-birthday list")) {
    console.log("COMMAND received");
    //console.log(msg.guild.members.cache)
    msg.guild.members.cache.forEach((mem) => {
      console.log(mem.user.id);
      msg.channel.send(
        mem.user.username + ": " + findtimeleft(msg, mem.user.id)
      );
    });
  } else if (txt.startsWith("-birthday")) {
    const birthdayval = txt.split("-birthday ")[1];

    //validate if the text is in date format
    if (birthdayval) {
      if (moment(birthdayval, "MM/DD/YY", true).isValid()) {
        const monthval = birthdayval.split("/")[0];
        const dateval = birthdayval.split("/")[1];

        //sets the birthday in database
        database
          .ref("users/")
          .child(authorid)
          .child("info")
          .child("stats")
          .once("value")
          .then((snapshot) => {
            var birthdaysetuser = snapshot.val();
            database
              .ref("users/")
              .child(authorid)
              .child("info")
              .child("stats")
              .set({
                month: monthval,
                date: dateval,
                messagedalready: false,
                name: msg.author.username,
                id: msg.author.id,
              });
            msg.channel.send(
              embed(
                "Success",
                msg.author.username +
                  "'s birthday has been set to " +
                  birthdayval
              )
            );
          });
      } else {
        const member = msg.mentions.members.first();
        if (member) {
          var bdaydate, bdaymonth;
          database
            .ref("users/")
            .child(member.user.id)
            .child("info")
            .child("stats")
            .once("value")
            .then((snapshot) => {
              bdaydate = snapshot.val().date;
              bdaymonth = snapshot.val().month;

              bdaydate = parseInt(bdaydate);
              bdaymonth = parseInt(bdaymonth);
              if (bdaydate > 0 && bdaymonth > 0) {
                var monthsleft = bdaymonth - moment().month() - 1;
                var daysleft = bdaydate - moment().date() - 1;
                var hoursleft = 24 - moment().hour() - 1;
                var minutesleft = 60 - moment().minute();
                if (monthsleft < 0) {
                  monthsleft = 12 + monthsleft;
                }
                if (daysleft < 0) {
                  daysleft = 30 + daysleft;
                  monthsleft--;
                }
                if (hoursleft < 0) {
                  hoursleft = 24 + hoursleft;
                }
                if (minutesleft < 0) {
                  minutesleft = 60 + minutesleft;
                }
                msg.channel.send(
                  embed(
                    "Time Left",
                    "Time left until birthday:\n" +
                      monthsleft +
                      " months, " +
                      daysleft +
                      " days, " +
                      hoursleft +
                      " hours, " +
                      minutesleft +
                      " minutes"
                  )
                );
              } else {
                msg.channel.send(
                  embed("Failed", "You didn't input your birthday yet")
                );
              }
            });
        }
      }
    } else {
      //if the user just sends -birthday to find out how many days are left until their birthday
      var bdaydate, bdaymonth;
      database
        .ref("users/")
        .child(authorid)
        .child("info")
        .child("stats")
        .once("value")
        .then((snapshot) => {
          bdaydate = snapshot.val().date;
          bdaymonth = snapshot.val().month;

          bdaydate = parseInt(bdaydate);
          bdaymonth = parseInt(bdaymonth);
          if (bdaydate > 0 && bdaymonth > 0) {
            var monthsleft = bdaymonth - moment().month() - 1;
            var daysleft = bdaydate - moment().date() - 1;
            var hoursleft = 24 - moment().hour() - 1;
            var minutesleft = 60 - moment().minute();
            if (monthsleft < 0) {
              monthsleft = 12 + monthsleft;
            }
            if (daysleft < 0) {
              daysleft = 30 + daysleft;
              monthsleft--;
            }
            if (hoursleft < 0) {
              hoursleft = 24 + hoursleft;
            }
            if (minutesleft < 0) {
              minutesleft = 60 + minutesleft;
            }
            msg.channel.send(
              embed(
                "Time Left",
                "Time left until birthday:\n" +
                  monthsleft +
                  " months, " +
                  daysleft +
                  " days, " +
                  hoursleft +
                  " hours, " +
                  minutesleft +
                  " minutes"
              )
            );
          } else {
            msg.channel.send(
              embed("Failed", "You didn't input your birthday yet")
            );
          }
        });
    }
  } else if (txt.startsWith("-ping")) {
    const number = parseInt(txt.split(" ")[1]);
    if (number) {
      if (
        number <= 20 ||
        msg.author.id == 741787458802417686 ||
        (msg.author.id == 534862360289083392 && number <= 50)
      ) {
        const messagecontent = txt.split("-ping " + number)[1];
        const memberpinging = msg.mentions.members.first();
        if (memberpinging) {
          if (memberpinging.user.id == 741787458802417686) {
            msg.channel.send(messagecontent);
          } else {
            for (var i = 0; i < number; i++) {
              msg.channel.send(messagecontent);
            }
          }
        } else {
          for (var i = 0; i < number; i++) {
            msg.channel.send(messagecontent);
          }
        }
      } else {
        msg.channel.send(
          embed(
            "Failed",
            "That's too high a number. It's going to overflow the chat."
          )
        );
      }
    } else {
      msg.channel.send(
        embed("Failed", "You didn't specify how many times to use the command")
      );
    }
  } else if (txt.startsWith("-setfortnite ")) {
    const username = txt.split("-setfortnite")[1];
    const regex = /-setfortnite (pc|xbox)\s./;
    if (regex.test(txt)) {
      const headers = {
        "TRN-Api-Key": "3167afc5-4dab-4268-86c3-862f415b2674",
      };
      fetch(
        "https://api.fortnitetracker.com/v1/profile/" +
          txt.split(" ")[1] +
          "/" +
          txt.split(" ")[2],
        {
          method: "GET",
          headers: headers,
        }
      )
        .then((res) => res.json())
        .then((body) => {
          if (body.error) {
            msg.channel.send(
              embed(
                "Player not found.",
                "Are you sure you entered the right USERNAME and PLATFORM?"
              )
            );
          } else {
            var lifetime = body.lifeTimeStats;
            var output = lifetime.filter(function (i) {
              return i.key == "Wins";
            });
            console.log(output);
          }
        })
        .catch((err) => console.log(err));
    }
  }  else if (txt.startsWith("-fortnite ")) {
    const username = txt.split("-fortnite")[1];
    if (true) {
      const url =
        "https://fortnite-api.com/v1/stats/br/v2?name=" + txt.split(" ")[1];
      fetch(url)
        .then((res) => res.json())
        .then((body) => {
          if (body.error) {
            msg.channel.send(body.error);
            return;
          }
          var lifetime = body.data.stats.all;
          const kills = lifetime.overall.kills;
          const userwins = lifetime.overall.wins;
          const kd = lifetime.overall.kd;
          const matches = lifetime.overall.matches;
          const time = parseInt(lifetime.overall.minutesPlayed / 60);
          const solo = lifetime.solo.wins;
          const duo = lifetime.duo.wins;
          const squad = lifetime.squad.wins;
          const winrate = lifetime.overall.winRate;

          const fortniteembed = new Discord.MessageEmbed()
            .setTitle("**" + body.data.account.name + "**")
            .setDescription("▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬")
            .setThumbnail(body.avatar)
            .addFields(
              { name: "Lifetime Kills", value: kills, inline: true },
              { name: "K/D", value: kd, inline: true },
              { name: "** **", value: "** **", inline: true },
              { name: "Lifetime Wins", value: userwins, inline: true },
              { name: "Win Rate", value: winrate, inline: true },
              { name: "** **", value: "** **", inline: true },
              {
                name: "Solo Wins",
                value: solo,
                inline: true,
              },
              { name: "Duo Wins", value: duo, inline: true },
              { name: "Squad Wins", value: squad, inline: true },
              {
                name: "Total Matches Played",
                value: matches,
                inline: false,
              },
              {
                name: "Total Time WASTED",
                value: time + " hours",
                inline: true,
              }
            )
            .setColor("ORANGE");
          msg.channel.send(fortniteembed);
        })
        .catch((err) => console.log(err));
    }
  }
});

function findtimeleft(msg, id) {
  var bdaydate, bdaymonth;
  database
    .ref("users/")
    .child(id)
    .child("info")
    .child("stats")
    .once("value")
    .then((snapshot) => {
      if (!snapshot.val()) {
        return;
      }
      bdaydate = snapshot.val().date;
      bdaymonth = snapshot.val().month;

      bdaydate = parseInt(bdaydate);
      bdaymonth = parseInt(bdaymonth);
      if (bdaydate > 0 && bdaymonth > 0) {
        var monthsleft = bdaymonth - moment().month() - 1;
        var daysleft = bdaydate - moment().date() - 1;
        var hoursleft = 24 - moment().hour() - 1;
        var minutesleft = 60 - moment().minute();
        if (monthsleft < 0) {
          monthsleft = 12 + monthsleft;
        }
        if (daysleft < 0) {
          daysleft = 30 + daysleft;
          monthsleft--;
        }
        if (hoursleft < 0) {
          hoursleft = 24 + hoursleft;
        }
        if (minutesleft < 0) {
          minutesleft = 60 + minutesleft;
        }
        return (
          "Time left until birthday:\n" +
          monthsleft +
          " months, " +
          daysleft +
          " days, " +
          hoursleft +
          " hours, " +
          minutesleft +
          " minutes"
        );
      }
    });
}

function play(url, vc, connection, streamOptions) {
  playing = true;
  const stream = ytdl(queue[0], { quality: "highest" });
  const dispatcher = connection.play(stream, streamOptions);
  console.log("Started playing music...");
  dispatcher.on("finish", (end) => {
    queue.shift();
    console.log("Shifted");
    if (queue[0]) {
      play(queue, vc, connection, streamOptions);
      console.log("Play new song in queue");
    } else {
      playing = false;
    }
  });
  return dispatcher;
}
function stop(msg, vc) {
  queue = [];
  playing = false;
  vc.leave();
  msg.channel.send(
    embed("Stopped", "The music has been stopped by " + msg.author.username)
  );
}

function skip(msg, dispatcher, queue, voiceChannel, connection, streamOptions) {
  dispatcher.pause();
  msg.channel.send(
    embed("Skipped", "The song has been skipped by " + msg.author.username)
  );
  queue.shift();
  if (queue[0]) {
    play(queue, voiceChannel, connection, streamOptions);
  } else {
    playing = false;
  }
}

function embed(title, message) {
  const a = new Discord.MessageEmbed()
    .setTitle("**" + title + "**")
    .setDescription(message)
    .setColor("ORANGE");

  return a;
}

client.login("");
