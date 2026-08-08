import app from "./app";
import config from "./config";

const PORT = config.port;

const main = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`server is listening on port ${PORT}`);
    });
  } catch (error) {
    console.log("Error starting the server : ", error);
    process.exit(1);
  }
};

main();
