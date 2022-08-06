import { CommandInteraction, EmbedBuilder, User } from "discord.js";
import { Discord, Slash, SlashOption, SlashGroup, Guard } from "discordx";
import {
  getUserId,
  createExpense,
  doesItemExist,
  getAllExpenses,
} from "../database/mongo";
import { Pagination, PaginationResolver } from "@discordx/pagination";
import { ErrorHandler } from "../guards/error";
import { table } from "table";
import { client } from "../client";

const getUserFromMention = (mention: string) => {
  const matches = mention.match(/[0-9]+/);
  if (!matches) throw new Error(`No matching user found for ${mention}`);
  return matches[0];
};

@Discord()
@SlashGroup("expense", "See and add expenses")
export abstract class commit {
  @Slash("add", { description: "Commit a new expense" })
  @Guard(ErrorHandler)
  async commit(
    @SlashOption("payers", {
      description: "The people who should pay",
      required: true,
    })
    payers: string,
    @SlashOption("items", {
      description:
        "The amount that they should pay, can also be a (list) of items",
      required: true,
    })
    items: string,
    @SlashOption("description", {
      description: "A (short) description of the expense",
      required: true,
    })
    description: string,
    interaction: CommandInteraction,
    @SlashOption("recipient", {
      description:
        "The person who paid for the expense, omit to indicate yourself",
      required: false,
    })
    recipient?: User
  ) {
    if (description.length >= 128)
      throw new Error(
        "Please keep the message length underneath 255 characters"
      );

    const guildId = interaction.guildId;

    if (guildId === null) throw new Error("guildId is null");

    // Bad input checks
    // Check that payers are valid persons
    const payersArray = payers.trim().split(" ");
    const payersIds = await Promise.all(
      payersArray.map(
        async (payer) =>
          (
            await getUserId(getUserFromMention(payer), guildId)
          ).userId
      )
    );

    // Check that the recipient is a valid person
    const recipientId: string = recipient
      ? recipient.id
      : (await getUserId(interaction.user.id, guildId)).userId;

    // Check whether items is an array of items or a number
    const itemsArray = items.split(" ");

    if (!itemsArray.length) throw new Error("No items are given");

    if (!Number(itemsArray[0])) {
      // Check that the items exist
      //   const expandedItems = [];

      for (const item of itemsArray) {
        if (!(await doesItemExist(guildId, item)))
          throw new Error(`Ìtem ${item} is not a recognised item.`);

        // const { id } = await getItem(guildId, item);
        // if (_id) expandedItems.push(_id);
        // else throw new Error(`Ìtem ${item} is not a recognised item.`);
      }

      itemsArray.forEach((item) =>
        createExpense(
          guildId,
          recipientId,
          payersIds,
          {
            type: "item",
            item,
          },
          description
        )
      );
    } else {
      // Check that amount is positive
      const amount = Number(itemsArray[0]);

      if (amount <= 0)
        throw new Error("Amount should be a strict positive number.");

      createExpense(
        guildId,
        recipientId,
        payersIds,
        { type: "custom", custom: amount },
        description
      );
    }
  }

  @Slash("list", { description: "Shows a list of the expenses" })
  async list(interaction: CommandInteraction) {
    const guildId = interaction.guildId;
    if (guildId === null) throw new Error("guildId is null");
    const expenses = await getAllExpenses(guildId);

    const populatedExpenses: string[][] = await Promise.all(
      expenses.map(async ({ from, to, item, description }) => [
        client.users.cache.get(from.userId)!.username,
        client.users.cache.get(to.userId)!.username,
        item!.type === "custom" ? item!.value : item!.title,
        description,
      ])
    );

    if (expenses.length > 0) {
      const expensesPerPage = 15;
      const amountPages = Math.floor(expenses.length / expensesPerPage) + 1;
      const embedx = new PaginationResolver((page) => {
        const rows = [["From", "To", "Item", "Description"]];
        rows.push(
          ...populatedExpenses.slice(
            expensesPerPage * page,
            expensesPerPage * (page + 1)
          )
        );

        const tableS =
          "**Expenses**" +
          "```" +
          table(rows) +
          "```" +
          `\n *Page ${page + 1} of ${amountPages}*`;

        return tableS;
      }, amountPages);

      const pagination = new Pagination(interaction, embedx, {
        type: "BUTTON",
      });

      await pagination.send();
    } else {
      const embed = new EmbedBuilder().setTitle("Expenses");
      embed.setDescription("No expenses made yet");
      interaction.reply({ embeds: [embed] });
    }
  }
}
