define(['app', 'core/CustomUIView', 'utils', 'core/overlays/overlays','moment'], function (app, UIView, Utils, Overlays, moment) {

  'use strict';

  return UIView.extend({
    events: {},
    template: 'ckeditor/input',
    serialize: function () {
      var value = this.options.value || '';
      return {
        name: this.options.name,
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        value: value,
      }
    },
    /**
     * Life cycle hook called by Directus after everything is rendered on the page
     * Use this section to set up anything that requires HTML nodes
     */
    afterRender: function () {
      var that = this,
        cdn = "//cdn.ckeditor.com/4.6.0/full/ckeditor.js",
        //TODO: can't get the server to work so use the CDN for now
        server = window.location.origin + window.directusData.path + "assets/js/libs/ckeditor/ckeditor.js";


      $.ajax({
        url: cdn,
        dataType: "script",
        success: function () {
          that.initEditor();
        }
      });

    },
    /**
     * This is the logic required to set up the entire CKEditor
     * as well as the associated dialog tweaks TO CKEDITOR to work with Directus
     */
    initEditor: function () {
      var that = this;

      var editorConfig = {
        // override custom config
        readOnly: that.options.settings.get('readonly'),
        height: that.options.settings.get('height'),
        image_previewText: CKEDITOR.tools.repeat( '___ ', 100 ),
        customConfig: '',
        toolbar:  // TODO: Hook the options up here from the UIOptions
          [
            {
              name: 'clipboard',
              items: that.options.settings.get('clipboard') ? ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'] : []
            },
            {name: 'editing', items: that.options.settings.get('editing') ? ['Scayt'] : []},
            {name: 'links', items: that.options.settings.get('links') ? ['Link', 'Unlink', 'Anchor'] : []},
            {
              name: 'insert',
              items: that.options.settings.get('insert') ? ['Image', 'Table', 'HorizontalRule', 'SpecialChar'] : []
            },
            {name: 'tools', items: that.options.settings.get('tools') ? ['Maximize'] : []},
            {name: 'document', items: that.options.settings.get('document') ? ['Source'] : []},
            '/',
            {
              name: 'basicstyles',
              items: that.options.settings.get('basicstyles') ? ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat'] : []
            },
            {
              name: 'paragraph',
              items: that.options.settings.get('paragraph') ? ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote'] : []
            },
            {name: 'styles', items: that.options.settings.get('styles') ? ['Styles', 'Format'] : []}
          ]
      };

      // set our image dialog stuff
      CKEDITOR.on('dialogDefinition', function (ev) {
        // Take the dialog window name and its definition from the event data.
        var dialogName = ev.data.name;
        var dialogDefinition = ev.data.definition;

        if (dialogName == 'image') {

          // Get a reference to the "Link Info" tab and the "Browse" button.
          var infoTab = dialogDefinition.getContents('info');
          var browseButton = infoTab.get('browse');

          //Make the browse button visible and add a onClick function
          browseButton.hidden = false;
          browseButton.onClick = function () {
            // Show the image UI and set the info:urlTxt
            that.showImageUI();
          };


          // show the upload tab
          var uploadTab = dialogDefinition.getContents('Upload');
          uploadTab.hidden = false;

          var chooseFileBtn = uploadTab.get('upload');
          chooseFileBtn.onClick = function (e) {
            that.inputFile = e.data.$.target;
          };

          // hide the link tab
          var linkTab = dialogDefinition.getContents('Link');
          linkTab.hidden = true;

          // Change the upload button to not do anything
          var uploadButton = uploadTab.get('uploadButton');
          uploadButton.onClick = function () {
            that.handleFileSelect(that.inputFile);
            return false;
          }
        }
      });


      //this is where we set up the editor
      var editor = CKEDITOR.replace('ckeditor_interface_' + this.options.name, editorConfig);

      // Set our text-change event handler to set our value
      editor.on('change', function (evt) {
        // getData() returns CKEditor's HTML content.
        var content = evt.editor.getData();
        var value = that.model.get(that.name);
        $('#ckeditor_' + that.options.name).val(content);
        that.model.set(that.name, content);
      });

      // Add the Content from the db into the CKEditor instance at the start
      editor.setData(that.options.value);

      // Add focus styles
      editor.on('focus', function (e) {
        e.editor.element.$.classList.add('cke_focus');
      });

      editor.on('blur', function (e) {
        e.editor.element.$.classList.remove('cke_focus');
      });

    },
    /**
     * Shows the Directus user interface for selecting files on the server
     * @param {element} input - The selector for the input:file element
     */
    handleFileSelect: function (input) {
      var file = input.files[0];
      var EntriesManager = require('core/EntriesManager'); // eslint-disable-line import/no-unresolved
      var self = this;
      this.relatedTable = 'directus_files';
      this.relatedCollection = EntriesManager.getNewInstance(this.relatedTable);
      //send files takes a list
      app.sendFiles([file], function (data) {
        if (data && typeof (data[0]) === 'object') {
          var fileModel = new self.relatedCollection.model({}, { // eslint-disable-line new-cap
            collection: self.relatedCollection,
            parse: true
          });

          fileModel.setFile(file, function (item) {
            fileModel.save(item, {
              success: function () {
                $(document).on('ajaxStart.directus', function () {
                  app.trigger('progress');
                });

                self.relatedCollection.add(fileModel);
                var url = window.location.protocol + "//" + window.location.host + fileModel.makeFileUrl(false);
                var dialog = CKEDITOR.dialog.getCurrent();
                dialog.selectPage('info');
                dialog.getContentElement('info', 'txtUrl').setValue(url);
              },
              error: function () {
                $(document).on('ajaxStart.directus', function () {
                  app.trigger('progress');
                });
              },
              wait: true
            });
          });
        }
      });
      // app.sendFiles(item, function (data) {
      //   if (data && typeof(data[0]) === 'object') {
      //     var name = {
      //       title: data[0].name,
      //       size: data[0].size,
      //       type: data[0].type
      //     };
      //     var table = app.schemaManager.getTable('directus_users');
      //     item.user = app.user.id;
      //     item[table.getStatusColumnName()] = table.getStatusDefaultValue();

      //     name['date_uploaded'] = moment().format();
      //     var model = new self.relatedCollection.model(name, {
      //       collection: self.relatedCollection,
      //       parse: true
      //     });
      //     var attributes = data[0];
      //     attributes['type'] = name.type;
      //     model.save(attributes, {
      //       success: function (e) {
      //         var url = window.location.protocol + "//" + window.location.host + model.makeFileUrl(false);

      //         var dialog = CKEDITOR.dialog.getCurrent();
      //         dialog.getContentElement('info', 'txtUrl').setValue(url);
      //         dialog.selectPage('info');
      //       }
      //     });
      //   }
      // });


    },
    /**
     * Shows the Directus user interface for selecting files on the server
     */
    showImageUI: function () {
      // TODO: Fix the canceled state to show the CKEditor dialog again.
      // Hide these cke_dialog_background_cover cke_reset_all
      $('.cke_reset_all').css({display: 'none'});
      $('.cke_dialog_background_cover').css({display: 'none'});

      // This opens up or image select/upload dialog and inserts the selected/uploaded image
      var collection = app.files;
      var model;
      var fileModel = new app.files.model({}, {collection: collection});
      collection.fetch();
      var view = new Overlays.ListSelect({collection: collection, selectable: true});
      app.router.overlayPage(view);
      var self = this;
      view.itemClicked = function (e) {
        var id = $(e.target).closest('tr').attr('data-id');
        model = collection.get(id);
        app.router.removeOverlayPage(this);

        var url = window.location.protocol + "//" + window.location.host + model.makeFileUrl(false);

        // set the CKEDitor Image dialog back to normal
        $('.cke_reset_all').css({display: 'block'});
        $('.cke_dialog_background_cover').css({display: 'block'});

        // set the CKEditor image Url
        var dialog = CKEDITOR.dialog.getCurrent();
        dialog.getContentElement('info', 'txtUrl').setValue(url);
      };
    }
  });
});

