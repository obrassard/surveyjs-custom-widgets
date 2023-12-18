import Inputmask from "inputmask";

function init(Survey) {
  const updateColumnPropInfo = function (propJSON, name) {
    propJSON.visibleIf = (obj) => {
      return obj.cellType === "text";
    };
    propJSON.onGetValue = (obj) => {
      return obj.templateQuestion[name];
    };
    propJSON.onSetValue = (obj, val) => {
      obj.templateQuestion[name] = val;
    }    
  }
  var widget = {
    name: "maskedit",
    numericGroupSeparator: ",",
    numericRadixPoint: undefined,
    numericAutoGroup: true,
    numericDigits: 2,
    numericDigitsOptional: false,
    numericPlaceholder: "0",
    autoUnmask: true,
    clearIncomplete: true,
    showMaskOnHover: true,
    unmaskAsNumber: true,    
    widgetIsLoaded: function () {
      return typeof Inputmask != "undefined";
    },
    isFit: function (question) {
      if (question.getType() == "multipletext") return true;
      return (
        question.getType() == "text" &&
        (question.inputMask != "none" || question.inputFormat)
      );
    },
    isDefaultRender: true,
    activatedByChanged: function (activatedBy) {
      if (Survey.Serializer.findProperty("text", "inputMask")) return;
      var properties = [
        {
          name: "autoUnmask:boolean",
          category: "general",
          showMode: "form",
          default: true,
        },
        {
          name: "clearIncomplete:boolean",
          category: "general",
          showMode: "form",
          default: true,
        },
        {
          name: "showMaskOnHover:boolean",
          category: "general",
          showMode: "form",
          default: true,
        },
        { 
          name: "inputFormat", 
          showMode: "form",
          category: "general" },
        {
          name: "inputMask",
          showMode: "form",
          category: "general",
          default: "none",
          choices: [
            "none",
            "datetime",
            "currency",
            "decimal",
            "email",
            "phone",
            "ip",
          ],
        },
        {
          name: "numericDigits",
          category: "general",
          visible: false,
        },
        {
          name: "options",
          category: "general",
          visible: false,
        },
        {
          name: "unmaskAsNumber:boolean",
          category: "general",
          visible: false,
          default: true,
        },
        {
          name: "prefix",
          category: "general",
          visible: false,
        },
        {
          name: "suffix",
          category: "general",
          visible: false,
        },
      ];
      Survey.Serializer.addProperties("text", properties);
      Survey.Serializer.addProperties("multipletextitem", properties);
      updateColumnPropInfo(properties[0], "autoUnmask");
      updateColumnPropInfo(properties[1], "clearIncomplete");
      updateColumnPropInfo(properties[2], "showMaskOnHover");
      updateColumnPropInfo(properties[3], "inputFormat");
      updateColumnPropInfo(properties[4], "inputMask");
      Survey.Serializer.addProperties(
        "matrixdropdowncolumn",
        properties
      );
    },
    applyInputMask: function (surveyElement, el) {
      var rootWidget = this;
      var mask =
        surveyElement.inputMask !== "none"
          ? surveyElement.inputMask
          : surveyElement.inputFormat;
      var options = {};
      if (typeof surveyElement.options === "object") {
        for (var option in surveyElement.options) {
          options[option] = surveyElement.options[option];
        }
      }
      options.autoUnmask = typeof surveyElement.autoUnmask !== "undefined"
        ? surveyElement.autoUnmask
        : rootWidget.autoUnmask;
      options.clearIncomplete = typeof surveyElement.clearIncomplete !== "undefined"
        ? surveyElement.clearIncomplete
        : rootWidget.clearIncomplete;
      options.showMaskOnHover = typeof surveyElement.showMaskOnHover !== "undefined"
        ? surveyElement.showMaskOnHover
        : rootWidget.showMaskOnHover;
      options.unmaskAsNumber = typeof surveyElement.unmaskAsNumber !== "undefined"
          ? surveyElement.unmaskAsNumber
          : rootWidget.unmaskAsNumber;
      if (surveyElement.inputMask !== "none") {
        options.inputFormat = surveyElement.inputFormat;
      }
      if (
        surveyElement.inputMask === "currency" ||
        surveyElement.inputMask === "decimal"
      ) {
        options.groupSeparator = rootWidget.numericGroupSeparator;
        options.radixPoint = rootWidget.numericRadixPoint;
        options.autoGroup = rootWidget.numericAutoGroup;
        options.placeholder = rootWidget.numericPlaceholder;        
      }
      if (surveyElement.inputMask === "currency") {
        options.digits = surveyElement.numericDigits || rootWidget.numericDigits;
        options.digitsOptional = rootWidget.numericDigitsOptional;
        options.prefix = surveyElement.prefix || "";
        options.suffix = surveyElement.suffix || "";
        options.placeholder = rootWidget.numericPlaceholder;        
      }
      // if (surveyElement.inputMask == "datetime") {
      //   mask = surveyElement.inputFormat;
      // }
      if (surveyElement.inputMask === "phone" && !!surveyElement.inputFormat) {
        mask = surveyElement.inputFormat;
      }
      Inputmask(mask, options).mask(el);

      el.onblur = function () {
        if (!el.inputmask) return;
        if (surveyElement.value === el.inputmask.getemptymask()) {
          surveyElement.value = "";
        }
      };

      var customWidgetData =
        surveyElement.getType() === "multipletextitem"
          ? surveyElement.editorValue.customWidgetData
          : surveyElement.customWidgetData;
      el.oninput = function () {
        customWidgetData.isNeedRender = true;
      };

      var pushValueHandler = function () {        
        if (!el.inputmask) return;
        if (el.inputmask.isComplete()) {
          surveyElement.value = options.autoUnmask
            ? el.inputmask.unmaskedvalue()
            : el.value;
        } else {
          surveyElement.value = null;
        }
      };
      el.onfocusout = el.onchange = pushValueHandler;

      var updateHandler = function () {
        el.value =
          surveyElement.value === undefined || surveyElement.value === null
            ? ""
            : surveyElement.value;
      };
      surveyElement.valueChangedCallback = updateHandler;
      updateHandler();
    },
    afterRender: function (question, el) {      
      if (question.getType() != "multipletext") {
        var input = el.querySelector("input") || el;
        this.applyInputMask(question, input);
      } else {
        for (var i = 0; i < question.items.length; i++) {
          var item = question.items[i];
          if (item.inputMask != "none" || item.inputFormat) {
            var input = el.querySelector("#" + item.editor.inputId);
            if (input) {
              this.applyInputMask(item, input);
            }
          }
        }
      }
    },
    willUnmount: function (question, el) {
      var input = el.querySelector("input") || el;
      if (!!input && !!input.inputmask) {
        input.inputmask.remove();
      }
    },
  };

  Survey.CustomWidgetCollection.Instance.addCustomWidget(widget);
}

if (typeof Survey !== "undefined") {
  init(Survey);
}

export default init;
