import { DreeperClient } from "../structures";

export async function deployCommands(client: DreeperClient) {
  const app = await client.application?.fetch()
  const commands = client.commands.map(c => c.toJSON())
  await app?.commands.set(commands)
}

export function compareArrays(a1: any[], a2: any[]): boolean {
  if (a1.length != a2.length)
    return false;

  for (var i = 0, l = a1.length; i < l; i++) {
    if (a1[i] instanceof Array && a2[i] instanceof Array) {
      if (!compareArrays(a1[i], a2[i]))
        return false;
    }
    else if (a1[i] instanceof Object && a2[i] instanceof Object) {
      if (!compareObjects(a1[i], a2[i]))
        return false;
    }

    else if (a1[i] != a2[i]) {
      return false;
    }
  }
  return true;
}

export function compareObjects(o1: object, o2: object): boolean {
  for (const propName in o1) {
    if (o1.hasOwnProperty(propName) != o2.hasOwnProperty(propName)) {
      return false;
    }
    
    // @ts-ignore
    else if (typeof o1[propName] != typeof o2[propName]) {
      return false;
    }
  }
  
  for (const propName in o2) {
    if (o1.hasOwnProperty(propName) != o2.hasOwnProperty(propName)) {
      return false;
    }
    // @ts-ignore
    else if (typeof o1[propName] != typeof o2[propName]) {
      return false;
    }

    if (!o1.hasOwnProperty(propName))
      continue;

    // @ts-ignore
    if (o1[propName] instanceof Array && o2[propName] instanceof Array) {
      // @ts-ignore
      if (!compareArrays(o1[propName], o2[propName]))
        return false;
    }
    // @ts-ignore
    else if (o1[propName] instanceof Object && o2[propName] instanceof Object) {
      // @ts-ignore
      if (!compareObjects(o1[propName], o2[propName]))
        return false;
    }
    // @ts-ignore
    else if (o1[propName] != o2[propName]) {
      return false;
    }
  }

  return true;
}