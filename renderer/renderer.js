let destinationFormat, outputDirectory;
const filePaths = new Set();

const changeVisibility = (elementId, bool) => (document.getElementById(elementId).hidden = bool);

const createFileListItem = (filePath, index) =>
  `<li id="file-list-item-${index}" filepath="${filePath}"><span id="filename-${index}" filepath="${filePath}">${path.basename(
    filePath
  )}</span><span style="float: right;"><img src="assets/img/cancel.png" id="cancel-button-${index}"></span></li>`;

const showFiles = () => {
  selectedFilesList.innerHTML = [...filePaths]
    .map((filePath, index) => createFileListItem(filePath, index))
    .join("");

  Array.prototype.forEach.call(document.querySelectorAll("[id^=cancel-button]"), element => {
    element.addEventListener("click", removeFileOnClick(element));
  });

  Array.prototype.forEach.call(document.querySelectorAll("[id^=filename]"), element => {
    element.addEventListener("click", previewImageOnClick(element));
  });
};

const processAddedFiles = selectedFiles => {
  const input_extension = getCommonFileExtension([...filePaths, ...selectedFiles]);
  console.log(input_extension);
  if (!input_extension) {
    alert("Error: Please upload files of same format");
    return;
  } else if (IMAGE_FORMATS.includes(input_extension)) {
    fillSharpOptions(input_extension);
    destFormatDropdown.disabled = false;
    chooseDirectoryBtn.disabled = false;
  } else if (AUDIO_VIDEO_FORMATS.includes(input_extension)) {
    fillFFmpegOptions(input_extension);
    destFormatDropdown.disabled = false;
    chooseDirectoryBtn.disabled = false;
  }

  selectedFiles.forEach(filePath => filePaths.add(filePath));
  showFiles();

  // TRANSITION - 1
  changeVisibility("screen-1", true);
  changeVisibility("screen-2", false);
};

const addFiles = e => {
  // Open file selector dialog
  const selectedFiles = dialog.showOpenDialogSync({
    title: "Select files to convert",
    filters: [
      {
        name: "Image/Audio/Video",
        extensions: ALL_FORMATS,
      },
      { name: "All Files", extensions: ["*"] },
    ],
    properties: ["openFile", "multiSelections"],
  });

  if (!selectedFiles || selectedFiles.length === 0) {
    console.log("No files selected.");
    return;
  }

  processAddedFiles(selectedFiles);
};

const convertButtonOnClick = e => {
  // default value
  if (!destinationFormat) destinationFormat = destFormatDropdown.options[0].value;

  try {
    if (IMAGE_FORMATS.includes(destinationFormat))
      filePaths.forEach(filepath => sharpConvert(filepath, destinationFormat, outputDirectory));
    else if (AUDIO_VIDEO_FORMATS.includes(destinationFormat))
      filePaths.forEach(filepath => ffmpegConvert(filepath, destinationFormat, outputDirectory));
  } catch (error) {
    alert(error);
  }

  // Open the output directory
  openDirectory(outputDirectory);

  // TRANSITION - 2
  changeVisibility("screen-2", true);
  changeVisibility("screen-3", false);
};

const removeFileOnClick = element => e => {
  filepath = $(`#${element.id}`).closest("li")[0].getAttribute("filepath");
  filePaths.delete(filepath);
  $(`#${element.id}`).closest("li").remove();
  $("#image-preview").removeAttr("src");
};

const previewImageOnClick = element => e => {
  filepath = element.getAttribute("filepath");
  $("#image-preview")[0].src = filepath;

  // remove all active classes
  $("[id^=file-list-item]").removeClass("active");
  // add the active class to the current element
  $(`#${element.id}`).closest("[id^=file-list-item]").addClass("active");
};

const [
  convertButton,
  destFormatDropdown,
  filePickerDiv,
  selectedFilesList,
  addMoreBtn,
  chooseDirectoryBtn,
  convertAgainBtn,
] = [
  "convert-files-btn",
  "dest-format-dropdown",
  "file-picker",
  "selected-files",
  "add-more-files-btn",
  "choose-directory-btn",
  "convert-again",
].map(id => document.getElementById(id));

document.addEventListener("drop", event => {
  event.preventDefault();
  event.stopPropagation();

  if (event.dataTransfer.files)
    processAddedFiles(Array.from(event.dataTransfer.files).map(f => f.path));
});

document.addEventListener("dragover", e => {
  e.preventDefault();
  e.stopPropagation();
});

[filePickerDiv, addMoreBtn].forEach(elem => elem.addEventListener("click", addFiles));

chooseDirectoryBtn.addEventListener("click", e => {
  outputDirectory = dialog.showOpenDialogSync({
    title: "Choose output directory",
    properties: ["openDirectory", "createDirectory"],
  })[0];

  $("#chosen-directory").text(outputDirectory);

  if (outputDirectory) {
    convertButton.disabled = false;
  } else {
    alert("Error: Please choose output directory");
  }
});

destFormatDropdown.addEventListener("click", e => {
  destinationFormat = destFormatDropdown.options[destFormatDropdown.selectedIndex].value;
});

convertButton.addEventListener("click", convertButtonOnClick);

convertAgainBtn.addEventListener("click", () => {
  // reset the state
  filePaths.clear();
  destinationFormat = null;
  outputDirectory = null;
  $("#image-preview").removeAttr("src");
  $("#chosen-directory").text("");

  changeVisibility("screen-3", true);
  changeVisibility("screen-1", false);
});
