/**
 * message controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::message.message", {
  async find(ctx) {
    strapi.log.debug("find messages");
    const user = ctx.state.user;
    ctx.query.filters = {
      ...((ctx.query.filters || {}) as { [key: string]: unknown }),
      $or: [{ sender: { id: user.id } }, { receiver: { id: user.id } }],
      $and: [{ isDeleted: false }],
    };
    strapi.log.debug(`modified filters: ${JSON.stringify(ctx.query.filters)}`);

    return super.find(ctx);
  },

  async delete(ctx) {
    strapi.log.debug("extending delete message");
    const user = ctx.state.user;
    const msgId = ctx.params.id;
    strapi.log.debug(
      `delete requets: ${JSON.stringify({ user: user.id, msgId })}`
    );
    if (!msgId) {
      return ctx.badRequest("Message id is required.");
    }
    const msg = await strapi
      .service("api::message.message")
      .findOne(msgId, { populate: ["sender"] });
    strapi.log.debug(`msg to delete: ${JSON.stringify(msg)}`);
    if (!msg || msg.sender.id !== user.id) {
      return ctx.forbidden("You are not authorized to delete this message.");
    }
    await strapi
      .service("api::message.message")
      .update(msgId, { data: { isDeleted: true } });

    return msg;
  },
});
