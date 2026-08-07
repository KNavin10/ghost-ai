import { logger, task, wait } from "@trigger.dev/sdk";

type HelloWorldPayload = {
  name: string;
};

export const helloWorldTask = task({
  id: "hello-world",
  maxDuration: 300,
  run: async (payload: HelloWorldPayload, { ctx }) => {
    logger.info("Starting the hello-world task", {
      name: payload.name,
      runId: ctx.run.id,
    });

    await wait.for({ seconds: 5 });

    return {
      message: `Hello, ${payload.name}!`,
    };
  },
});