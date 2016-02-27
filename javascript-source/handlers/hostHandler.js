/**
 * hostHandler.js
 *
 * Register and announce (un)host events.
 * Optionally supports rewarding points for a follow (Only every 6 hours!)
 */
(function () {
  var hostReward = ($.inidb.exists('settings', 'hostReward') ? $.inidb.get('settings', 'hostReward') : 200),
      hostMessage = ($.inidb.exists('settings', 'hostMessage') ? $.inidb.get('settings', 'hostMessage') : $.lang.get('hosthandler.host.message')),
      hostTimeout = 216e5, //6 hours = 6 * 60 * 60 * 1000
      hostList = {},
      announceHosts = false;

  /**
   * @event twitchHostsInitialized
   */
  $.bind('twitchHostsInitialized', function () {
    if (!$.bot.isModuleEnabled('./handlers/hostHandler.js')) {
      return;
    }

    $.consoleLn(">> Enabling hosts announcements");
    announceHosts = true;
  });

  /**
   * @event twitchHosted
   */
  $.bind('twitchHosted', function (event) {
    if (!$.bot.isModuleEnabled('./handlers/hostHandler.js')) {
      return;
    }

    var hoster = $.username.resolve(event.getHoster()),
        now = $.systemTime(),
        msg = hostMessage;

    if (!announceHosts) {
      return;
    }

    $.writeToFile(hoster, "./addons/hostHandler/latestHost.txt", false);

    if (hostList[hoster]) {
      if (hostList[hoster].hostTime > now) {
        return;
      }
      hostList[hoster].hostTime = now + hostTimeout;
    } else {
      hostList[hoster] = {
        hostTime: now + hostTimeout
      };
    }

    msg = msg.replace('(name)', hoster);
    msg = msg.replace('(reward)', hostReward.toString());
    $.say(msg);
  });

  /**
   * @event twitchUnhosted
   */
  $.bind('twitchUnhosted', function (event) {
    if (!$.bot.isModuleEnabled('./handlers/hostHandler.js')) {
      return;
    }

    var hoster = event.getHoster();
    delete hostList[hoster];
  });

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs(),
        commandArg = parseInt(args[0]),
        temp = [],
        i;

    /**
     * @commandpath hostreward [amount] - Set the amount of points to reward when a channel starts hosting
     */
    if (command.equalsIgnoreCase('hostreward')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      if (isNaN(commandArg)) {
        $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostreward.usage', $.pointNameMultiple));
        return;
      }

      $.inidb.set('settings', 'hostReward', commandArg);
      $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostreward.success', $.getPointsString(commandArg)));
    }

    /**
     * @commandpath hostmessage [message] - Set a message given when a channel hosts
     */
    if (command.equalsIgnoreCase('hostmessage')) {
      if (!args || args.length == 0) {
        $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostmessage.usage'));
        return;
      }

      hostMessage = event.getArguments();
      $.inidb.set('settings', 'hostMessage', hostMessage);
      $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostmessage.success'));
    }

    /**
     * @commandpath unhost - Send the /unhost command to twitch
     */
    if (command.equalsIgnoreCase('unhost')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      $.say('.unhost');
    }

    /**
     * @commandpath host [channel] - Send the /host command to twitch
     */
    if (command.equalsIgnoreCase('host')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      $.say('.host ' + args[0]);
    }

    /**
     * @commandpath hostcount - Announce the current number of other channels hosting this channel
     */
    if (command.equalsIgnoreCase('hostcount')) {
      for (i in hostList) {
        temp.push(i);
      }

      if (temp.length == 0) {
        $.say($.lang.get('hosthandler.hostcount.404'));
        return;
      }
      $.say($.lang.get('hosthandler.hostcount', temp.length));
    }

    /**
     * @commandpath hostlist - Announce a list of current other channels hosting this channel
     */
    if (command.equalsIgnoreCase('hostlist')) {
      for (i in hostList) {
        temp.push(i);
      }

      if (temp.length == 0) {
        $.say($.lang.get('hosthandler.hostlist.404'));
        return;
      }

      $.say($.lang.get('hosthandler.hostlist', temp.join(', ')));
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./handlers/hostHandler.js')) {
      $.registerChatCommand('./handlers/hostHandler.js', 'hostmessage', 1);
      $.registerChatCommand('./handlers/hostHandler.js', 'hostreward', 1);
      $.registerChatCommand('./handlers/hostHandler.js', 'unhost', 1);
      $.registerChatCommand('./handlers/hostHandler.js', 'host', 1);
      $.registerChatCommand('./handlers/hostHandler.js', 'hostcount');
      $.registerChatCommand('./handlers/hostHandler.js', 'hostlist');
    }
  });
})();
