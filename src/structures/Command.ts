import { ApplicationCommandOptionData, ApplicationCommandType, AutocompleteInteraction, PermissionString } from "discord.js"
import { CommandOptions } from "../types"
import { DreeperClient } from "./Client"
import { DreeperCommandInteraction } from "./ContextInteraction"

export class Command {
  type: ApplicationCommandType
  name: string
  description: string
  category?: string
  execute: (client: DreeperClient, interaction: DreeperCommandInteraction) => Promise<void>
  autocomplete?: (client: DreeperClient, interaction: AutocompleteInteraction) => Promise<void>
  options: ApplicationCommandOptionData[] | []
  isDeveloperOnly: boolean
  userPermissions: PermissionString[]
  botPermissions: PermissionString[]

  constructor(options: CommandOptions){
    if (options.name && typeof options.name == "string") this.name = options.name
    else throw new Error('INVALID COMMAND NAME')

    this.description = options.description ?? ""
    this.category = options.category ?? ""

    if (options.execute && typeof options.execute == "function") this.execute = options.execute
    else throw new Error('INVALID COMMAND EXECUTE FN')
    if (options.autocomplete && typeof options.autocomplete == "function") this.autocomplete = options.autocomplete

    this.options = options.options || []
    this.isDeveloperOnly = options.isDeveloperOnly ?? false
    this.type = options.type || "CHAT_INPUT"
    this.userPermissions = options.userPermissions || []
    this.botPermissions = options.botPermissions || []
  }

  toJSON() {
    return { type: this.type, name: this.name, description: this.description, options: this.options }
  }
}