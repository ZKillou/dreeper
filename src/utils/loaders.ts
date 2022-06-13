import { readdirSync } from 'fs';
import { DreeperClient } from '../structures/Client';
import { Command } from '../structures/Command';
import { Event } from '../types';

export function loadCommands(client: DreeperClient, dir: string): void {
  readdirSync(dir).forEach(async dirs => {
    const commands = readdirSync(`${dir}/${dirs}/`).filter(files =>
      files.endsWith('.js')
    );

    for (const file of commands) {
      loadCommand(client, `../../${dir}/${dirs}/${file}`);
    }
  });
}

export function loadEvents(client: DreeperClient, dir: string) {
  readdirSync(dir).forEach(async dirs => {
    const events = readdirSync(`${dir}/${dirs}/`).filter(files =>
      files.endsWith('.js')
    );

    for (const file of events) {
      loadEvent(client, `../../${dir}/${dirs}/${file}`);
    }
  });
}

export async function loadCommand(
  client: DreeperClient,
  path: string
): Promise<void> {
  const command = (await import(path)) as Command;

  client.commands.set(command.name, command);

  console.log(`COMMAND: ${command.name} loaded`);
}

export async function loadEvent(
  client: DreeperClient,
  path: string
): Promise<void> {
  const event = (await import(path)) as Event;
  const fn = event.execute.bind(null, client);

  if (event.once) client.once(event.name, fn);
  else client.on(event.name, fn);

  console.log(`EVENT: ${event.name} loaded`);
}
