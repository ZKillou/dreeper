import { Client, ClientOptions, Collection } from "discord.js";
import { loadCommands, loadEvent, loadEvents } from "../utils/loaders";
import { DreeperOptions } from "../types";
import { Command } from "./Command";
import { Config } from "./Config";

export class DreeperClient extends Client {
  doptions: DreeperOptions
  config: Config
  mongoose?: any
  commands: Collection<string, Command>
  i18n?: Map<string, any>
  fn?: any

  constructor(djsoptions: ClientOptions, dreeperoptions: DreeperOptions) {
    super(djsoptions)

    this.doptions = dreeperoptions
    if(dreeperoptions.config instanceof Config) this.config = dreeperoptions.config
    else this.config = new Config(dreeperoptions.config)

    this.mongoose = dreeperoptions.mongoose

    this.commands = new Collection()
  }

  async init() {
    if(this.mongoose && this.config.getDbPath()) await this.mongoose.init()
    await this.login(this.config.getToken())

    if (this.doptions.dirs.commands) loadCommands(this, this.doptions.dirs.commands)
    if (this.doptions.dirs.events) loadEvents(this, this.doptions.dirs.events)
    if (this.doptions.dirs.functions) {
      this.fn = await import(this.doptions.dirs.functions)
      bindClient(this)
    }

    let defaultsEvents = this.doptions.defaults.events
    if (defaultsEvents.interactionCreate) {
      loadEvent(this, `../defaults/events/interactionCreate`)
    }
    if (defaultsEvents.messageCreate) {
      loadEvent(this, `../defaults/events/messageCreate`)
    }
  }
}

function bindClient(client: DreeperClient, fns = client.fn) {
	for (let i of Object.keys(fns)) {
		if (typeof fns[i] == "object") {
			bindClient(client, fns[i])
			continue
		}

		fns[i] = fns[i].bind(client)
	}
}