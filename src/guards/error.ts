import { CommandInteraction, MessageEmbed } from "discord.js";
import { GuardFunction } from "discordx";

export const ErrorHandler: GuardFunction<CommandInteraction> = async (
  interaction,
  _client,
  next
) => {
  try {
    await next();
  } catch (err) {
    console.log("err :>> ", err);

    const errorMessage = err instanceof Error ? err.message : "unknown error";
    const embed = new MessageEmbed({
      title: "Oops!?",
      description: interaction.user + " " + errorMessage,
      color: "#fcc9c5",
    });

    interaction.reply({ embeds: [embed] });
  }
};
