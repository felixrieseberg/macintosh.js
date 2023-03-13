const { app, dialog } = require("electron");
const { getIsDevMode } = require("./devmode");

// If the app doesn't run from the /Applications folder,
// we don't get to create files, which keeps the emulator from
// running.
function moveToAppFolderMaybe() {
  if (process.platform !== "darwin") {
    return;
  }

  if (getIsDevMode()) {
    return;
  }

  if (app.isInApplicationsFolder()) {
    return;
  }

  const shouldMove = dialog.showMessageBoxSync({
    type: "question",
    buttons: ["Move to Applications Folder", "Quit"],
    defaultId: 0,
    message:
      "macintosh.js can only run from the Applications folder. Do you want to move the app there now?",
    cancelId: 1,
  });

  if (shouldMove === 0) {
    app.moveToApplicationsFolder({
      conflictHandler: (conflictType) => {
        if (conflictType === "exists") {
          return (
            dialog.showMessageBoxSync({
              type: "question",
              buttons: ["Halt Move", "Continue Move"],
              defaultId: 0,
              message: "An app of this name already exists",
            }) === 1
          );
        }
      },
    });
  } else {
    app.quit();
  }
}

module.exports = {
  moveToAppFolderMaybe,
};
