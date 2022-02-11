import { ApplicationCommandData } from "discord.js";
import { Client, Collection } from "discord.js";

interface ExtendedClient extends Client {
    commands: Collection<string, Command>;
    collectors: string[];
}

type Command = {
    name: string;
    ApplicationCommandData: ApplicationCommandData;
    execute: Function;
}

type CommandRegisterTypes = "guild" | "global"