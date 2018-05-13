// Description: CKEditor Custom UI for Directus
// Author: Chris Sprance (Entrada Interactive) - www.csprance.com
// CKEditor Docs: http://docs.ckeditor.com/

define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  return UIComponent.extend({
    id: 'ckeditor',
    dataTypes: ['TEXT', 'VARCHAR', 'CHAR', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT'],
    options: [
      // Disables editing of the field while still letting users see the value
      //TODO: Hook these up
      {id: 'readonly', type: 'Boolean', default_value: false, ui: 'toggle'},
      // The input's height in pixels before scrolling. Default: 500px
      {id: 'height', type: 'Number', default_value: 500, ui: 'numeric'},
      {id: 'clipboard', type: 'Boolean', default_value: false, ui: 'toggle'},
      {id: 'editing', type: 'Boolean', default_value: true, ui: 'toggle'},
      {id: 'links', type: 'Boolean', default_value: true, ui: 'toggle'},
      {id: 'insert', type: 'Boolean', default_value: true, ui: 'toggle'},
      {id: 'tools', type: 'Boolean', default_value: true, ui: 'toggle'},
      {id: 'document', type: 'Boolean', default_value: true, ui: 'toggle'},
      {id: 'basicstyles', type: 'Boolean', default_value: true, ui: 'toggle'},
      {id: 'paragraph', type: 'Boolean', default_value: true, ui: 'toggle'},
      {id: 'styles', type: 'Boolean', default_value: true, ui: 'toggle'},

    ],
    Input: Input,
    /**
     * This is sent before the row is saved and is used to validate any form values
     * @param {obj} value - the value of the field
     * @param {obj} options - global options object
     */
    validate: function (value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    /**
     * This is what is shown in list views
     */
    list: function (interfaceOptions) {
      return interfaceOptions.value
        ? interfaceOptions.value.toString().replace(/(<([^>]+)>)/ig, '').substr(0, 100)
        : '';
    }
  });
});