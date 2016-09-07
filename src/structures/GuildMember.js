const TextBasedChannel = require('./interface/TextBasedChannel');
const Role = require('./Role');
const Collection = require('../util/Collection');

/**
 * Represents a Member of a Guild on Discord
 * @implements {TextBasedChannel}
 */
class GuildMember {
  constructor(guild, data) {
    /**
     * The client that instantiated this GuildMember
     * @type {Client}
     */
    this.client = guild.client;
    Object.defineProperty(this, 'client', { enumerable: false, configurable: false });

    /**
     * The guild that this member is part of
     * @type {Guild}
     */
    this.guild = guild;

    /**
     * The user that this guild member instance Represents
     * @type {User}
     */
    this.user = {};

    this._roles = [];
    if (data) this.setup(data);
  }

  setup(data) {
    /**
     * Whether this member is deafened server-wide
     * @type {boolean}
     */
    this.serverDeaf = data.deaf;

    /**
     * Whether this member is muted server-wide
     * @type {boolean}
     */
    this.serverMute = data.mute;

    /**
     * Whether this member is self-muted
     * @type {boolean}
     */
    this.selfMute = data.self_mute;

    /**
     * Whether this member is self-deafened
     * @type {boolean}
     */
    this.selfDeaf = data.self_deaf;

    /**
     * The voice session ID of this member, if any
     * @type {?string}
     */
    this.voiceSessionID = data.session_id;

    /**
     * The voice channel ID of this member, if any
     * @type {?string}
     */
    this.voiceChannelID = data.channel_id;

    /**
     * Whether this meember is speaking
     * @type {?boolean}
     */
    this.speaking = this.speaking;

    /**
     * The nickname of this Guild Member, if they have one
     * @type {?string}
     */
    this.nickname = data.nick;

    this.user = data.user;
    this._roles = data.roles;
    this._joinDate = new Date(data.joined_at).getTime();
  }

  /**
   * The date this member joined the guild
   * @type {Date}
   */
  get joinDate() {
    return new Date(this._joinDate);
  }

  /**
   * A list of roles that are applied to this GuildMember, mapped by the role ID.
   * @type {Collection<string, Role>}
   * @readonly
   */
  get roles() {
    const list = new Collection();
    const everyoneRole = this.guild.roles.get(this.guild.id);

    if (everyoneRole) list.set(everyoneRole.id, everyoneRole);

    for (const roleID of this._roles) {
      const role = this.guild.roles.get(roleID);
      if (role) list.set(role.id, role);
    }

    return list;
  }

  /**
   * Whether this member is muted in any way
   * @type {boolean}
   * @readonly
   */
  get mute() {
    return this.selfMute || this.serverMute;
  }

  /**
   * Whether this member is deafened in any way
   * @type {boolean}
   * @readonly
   */
  get deaf() {
    return this.selfDeaf || this.serverDeaf;
  }

  /**
   * The voice channel this member is in, if any
   * @type {?VoiceChannel}
   * @readonly
   */
  get voiceChannel() {
    return this.guild.channels.get(this.voiceChannelID);
  }

  /**
   * The ID of this User
   * @type {string}
   * @readonly
   */
  get id() {
    return this.user.id;
  }

  /**
   * Mute/unmute a user
   * @param {boolean} mute Whether or not the member should be muted
   * @returns {Promise<GuildMember>}
   */
  setMute(mute) {
    return this.edit({ mute });
  }

  /**
   * Deafen/undeafen a user
   * @param {boolean} deaf Whether or not the member should be deafened
   * @returns {Promise<GuildMember>}
   */
  setDeaf(deaf) {
    return this.edit({ deaf });
  }

  /**
   * Moves the Guild Member to the given channel.
   * @param {ChannelResolvable} channel The channel to move the member to
   * @returns {Promise<GuildMember>}
   */
  setVoiceChannel(channel) {
    return this.edit({ channel });
  }

  /**
   * Sets the Roles applied to the member.
   * @param {Collection<string, Role>|Role[]|string[]} roles The roles or role IDs to apply
   * @returns {Promise<GuildMember>}
   */
  setRoles(roles) {
    return this.edit({ roles });
  }

  /**
   * Adds a single Role to the member.
   * @param {Role|string} role The role or ID of the role to add
   * @returns {Promise<GuildMember>}
   */
  addRole(role) {
    return this.addRoles([role]);
  }

  /**
   * Adds multiple roles to the member.
   * @param {Collection<string, Role>|Role[]|string[]} roles The roles or role IDs to add
   * @returns {Promise<GuildMember>}
   */
  addRoles(roles) {
    let allRoles;
    if (roles instanceof Collection) {
      allRoles = this._roles.slice();
      for (const role of roles.values()) allRoles.push(role.id);
    } else {
      allRoles = this._roles.concat(roles);
    }
    return this.edit({ roles: allRoles });
  }

  /**
   * Removes a single Role from the member.
   * @param {Role|string} role The role or ID of the role to remove
   * @returns {Promise<GuildMember>}
   */
  removeRole(role) {
    return this.removeRoles([role]);
  }

  /**
   * Removes multiple roles from the member.
   * @param {Collection<string, Role>|Role[]|string[]} roles The roles or role IDs to remove
   * @returns {Promise<GuildMember>}
   */
  removeRoles(roles) {
    const allRoles = this._roles.slice();
    if (roles instanceof Collection) {
      for (const role of roles.values()) {
        const index = allRoles.indexOf(role.id);
        if (index >= 0) allRoles.splice(index, 1);
      }
    } else {
      for (const role of roles) {
        const index = allRoles.indexOf(role instanceof Role ? role.id : role);
        if (index >= 0) allRoles.splice(index, 1);
      }
    }
    return this.edit({ roles: allRoles });
  }

  /**
   * Set the nickname for the Guild Member
   * @param {string} nick The nickname for the Guild Member
   * @returns {Promise<GuildMember>}
   */
  setNickname(nick) {
    return this.edit({ nick });
  }

  /**
   * Edit a Guild Member
   * @param {GuildmemberEditData} data The data to edit the member with
   * @returns {Promise<GuildMember>}
   */
  edit(data) {
    return this.client.rest.methods.updateGuildMember(this, data);
  }

  /**
   * Deletes any DMs with this Guild Member
   * @returns {Promise<DMChannel>}
   */
  deleteDM() {
    return this.client.rest.methods.deleteChannel(this);
  }

  /**
   * Kick this member from the Guild
   * @returns {Promise<GuildMember>}
   */
  kick() {
    return this.client.rest.methods.kickGuildMember(this.guild, this);
  }

  /**
   * Ban this Guild Member
   * @param {number} [deleteDays=0] The amount of days worth of messages from this member that should
   * also be deleted. Between `0` and `7`.
   * @returns {Promise<GuildMember>}
   * @example
   * // ban a guild member
   * guildMember.ban(7);
   */
  ban(deleteDays = 0) {
    return this.client.rest.methods.banGuildMember(this.guild, this, deleteDays);
  }

  sendMessage() {
    return;
  }

  sendTTSMessage() {
    return;
  }

  sendFile() {
    return;
  }
}

TextBasedChannel.applyToClass(GuildMember);

module.exports = GuildMember;
