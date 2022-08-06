import {
  CommandInteraction,
  GuildEmoji,
  Message,
  EmbedBuilder,
  ReactionEmoji,
  User,
} from "discord.js";
import { Discord, Slash, SlashOption, SlashGroup } from "discordx";
import {
  getAllExpenses,
  getUsers,
  getAllItems,
  payBack,
  doesUserExist,
} from "../database/mongo";
import { table } from "table";
import { client } from "../client";

@Discord()
@SlashGroup("resolve", "See and resolve outstanding payments")
export abstract class resolve {
  @Slash("summary", {
    description: "Get a summary of how much everyone owes eachother",
  })
  async summary(interaction: CommandInteraction) {
    const guildId = interaction.guildId;
    if (guildId === null) throw new Error("guildId is null");

    const items = await getAllItems(guildId);
    const expenses = await getAllExpenses(guildId);
    const users = await getUsers(guildId);
    const summary = new Map<string, number>();

    users.forEach((user) => summary.set(user.userId, 0));

    for (const expense of expenses) {
      const value =
        expense.item.type === "custom"
          ? expense.item.value
          : items.filter((item) => item._id.equals(expense.item.item))[0].value;

      summary
        .set(expense.from.userId, summary.get(expense.from.userId) ?? 0 - value)
        .set(expense.to.userId, summary.get(expense.to.userId) ?? 0 + value);
    }

    const summaryArray = Array.from(summary).map(([user, value]) => [
      client.users.cache.get(user)!.username,
      `${value} €`,
    ]);

    const rows = [["User", "Amount"]];
    rows.push(...summaryArray);
    interaction.reply("**Summary**" + "```" + table(rows) + "```");
  }

  @Slash("pay", { description: "Indicate that you paid someone back" })
  async pay(
    @SlashOption("person", {
      description: "The person who you paid back",
      required: true,
    })
    person: User,
    interaction: CommandInteraction
  ) {
    const guildId = interaction.guildId;
    if (guildId === null) throw new Error("guildId is null");
    if (!doesUserExist(guildId, person.id))
      throw new Error("The name doesn't match any user in our database");

    const deleteConfirmationEmbed = new EmbedBuilder()
      .setTitle("User pay back")
      .setDescription(`Please confirm that you want to pay back: ${person}`);

    const message = (await interaction.reply({
      embeds: [deleteConfirmationEmbed],
      fetchReply: true,
    })) as Message<true>;

    await message.react("❌");
    await message.react("✅");

    const filter = (
      reaction: { emoji: ReactionEmoji | GuildEmoji },
      user: { id: string }
    ) =>
      ["❌", "✅"].includes(reaction.emoji.name as string) &&
      user.id === interaction.user.id;

    const collected = await message
      .awaitReactions({ filter, max: 1, time: 60000, errors: ["time"] })
      .catch((collected: any) => {
        console.log(collected);
        throw new Error("You waited too long to respond. (Timeout)");
      });

    if (collected.get("❌")) {
      await message.reply("Cancelled the pay back.");
      return;
    } else const guildId = interaction.guildId;
    if (guildId === null) throw new Error("guildId is null");
    payBack(guildId, person.id)
      .then(() => {
        message.reply(`Succesfully paid back ${person}`);
      })
      .catch((e) => {
        throw new Error(e);
      });
  }
}
