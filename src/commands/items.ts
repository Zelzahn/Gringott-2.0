import {
  CommandInteraction,
  MessageEmbed,
  Message,
  ReactionEmoji,
  GuildEmoji,
} from "discord.js";
import { Discord, Slash, SlashOption, SlashGroup, Guard } from "discordx";
import {
  createItem,
  deleteItem,
  doesItemExist,
  getItems,
  updateItem,
} from "../database/mongo";
import { IItem } from "../database/Schematics/Item";
import { ErrorHandler } from "../guards/error";

const printItem = (item: IItem) =>
  `**${item.title}**: ${item.value} €\n\t${item.description}`;

@Discord()
@SlashGroup("items", "See and configure items")
export class items {
  @Slash("list", { description: "List all items" })
  async list(interaction: CommandInteraction) {
    await interaction.deferReply();

    const items = await getItems(interaction.guildId);
    // items = items.filter(({ isDeleted }) => !isDeleted);

    const embed = new MessageEmbed().setTitle("Configured items:");

    if (items.length > 0) {
      let left = "";
      let right = "";
      for (let index = 0; index < items.length; index++) {
        const item = items[index];

        if (index >= items.length / 2) right += `\n\n${printItem(item)}`;
        else left += `\n\n${printItem(item)}`;
      }

      embed.addField("\u200B", left ? left : "\u200B", true);
      embed.addField("\u200B", right ? right : "\u200B", true);
    } else embed.setDescription("No items set yet");

    interaction.reply({ embeds: [embed] });
  }

  @Slash("add", { description: "Add a new item" })
  @Guard(ErrorHandler)
  async add(
    @SlashOption("name", { description: "Name of the item", required: true })
    name: string,
    @SlashOption("amount", {
      description: "The amount that this item costs",
      required: true,
    })
    amount: number,
    @SlashOption("description", {
      description: "A short description of the item",
      required: true,
    })
    desription: string,
    interaction: CommandInteraction
  ) {
    if (amount <= 0) throw new Error("Amount should be a valid number >= 0");

    await createItem(interaction.guildId, name, amount, desription)
      .then(() => {
        interaction.reply(`Succesfully added ${name}`);
      })
      .catch((e) => {
        throw new Error(e);
      });
  }

  @Slash("edit", { description: "Edit an already configured item" })
  @Guard(ErrorHandler)
  async edit(
    @SlashOption("previous", {
      description: "(old) Name of the item",
      required: true,
    })
    oldName: string,
    @SlashOption("new", {
      description: "Updated name of the item",
      required: false,
    })
    name: string,
    @SlashOption("amount", {
      description: "The new amount",
      required: false,
    })
    amount: number,
    @SlashOption("description", {
      description: "A new description",
      required: false,
    })
    desription: string,
    interaction: CommandInteraction
  ) {
    if (amount <= 0) throw new Error("Amount should be a valid number >= 0");

    await updateItem(interaction.guildId, name, amount, desription)
      .then(() => {
        interaction.reply(`Succesfully updated ${oldName}`);
      })
      .catch((e) => {
        throw new Error(e);
      });
  }

  @Slash("delete", { description: "Delete an existing item" })
  @Guard(ErrorHandler)
  async delete(
    @SlashOption("name", { description: "Name of the item", required: true })
    name: string,
    interaction: CommandInteraction
  ) {
    if (!doesItemExist) throw new Error("The name doesn't match any item");

    const deleteConfirmationEmbed = new MessageEmbed()
      .setTitle("Item deletion")
      .setDescription(`Please confirm that you want to delete: ${name}`);

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
      await message.reply("Cancelled the deletion.");
      return;
    } else
      deleteItem(interaction.guildId, name)
        .then(() => {
          message.reply(`Succesfully deleted ${name}`);
        })
        .catch((e) => {
          throw new Error(e);
        });
  }
}
