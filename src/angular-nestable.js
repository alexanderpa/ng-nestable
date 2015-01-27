/**
 * Angular nestable 0.0.1
 * Copyright (c) 2014 Kamil Pekala
 * https://github.com/kamilkp/ng-nestable
 */

/**
 * Sample output HTML
	<div class="dd">
		<ol class="dd-list">
			<li class="dd-item" data-id="1">
				<!-- item element -->
			</li>
			<li class="dd-item" data-id="2">
				<!-- item element -->
			</li>
			<li class="dd-item" data-id="3">
				<!-- item element -->
				<ol class="dd-list">
					<li class="dd-item" data-id="4">
						<!-- item element -->
					</li>
					<li class="dd-item" data-id="5">
						<!-- item element -->
					</li>
				</ol>
			</li>
		</ol>
	</div>
 */

/**
 * Sample model object
	[
		{
			item: {},
			children: []
		},
		{
			item: {},
			children: [
				{
					item: {},
					children: []
				}
			]
		},
		{
			item: {},
			children: []
		}
	]
 */

;(function(window, document, angular, undefined){
	angular.module('ng-nestable', [])
		.provider('$nestable', function(){
			var modelName = '$item';
			var itemProperty = 'item';
			var childrenProperty = 'children';
			var childrenFilter = null;
			var orderBy = null;
			var orderByReverse = false;
			var collapseAllOnStart = false;
			var activeItemProperty = null;
			var collapsedItemProperty = null;
			var defaultOptions = {};

			this.$get = function(){
				return {
					modelName: modelName,
					itemProperty: itemProperty,
					childrenProperty: childrenProperty,
					childrenFilter: childrenFilter,
					orderBy: orderBy,
					orderByReverse: orderByReverse,
					collapseAllOnStart: collapseAllOnStart,
					activeItemProperty: activeItemProperty,
					collapsedItemProperty: collapsedItemProperty,
					defaultOptions: defaultOptions
				};
			};

			/**
			 * Method to set model variable for nestable elements
			 * @param  {[string]} value
			 */
			this.modelName = function(value){
				modelName = value;
			};

			/**
			 * Method to set property which contains child elements
			 * @param  {[string]} value
			 */
			this.childrenProperty = function(value){
				childrenProperty = value;
			};

			/**
			 * Method to set filter for children elements
			 * @param  filter - can be one of: string, Object, function(value, index)
			 */
			this.childrenFilter = function(filter){
				childrenFilter = filter;
			};

			/**
			 * Method to set filter for children elements
			 * @param  order - can be one of: string, function(value, index)
			 * @param  {[boolean]} reverse - Reverse the order of the array.
			 */
			this.orderBy = function(order, reverse){
				orderBy = order;
				orderByReverse = !!reverse;
			};

			/**
			 * Method to set property which contains item information
			 * @param  {[string]} value
			 *
			 * Use 'null' to expose item properties to object on the same level as children array
			 * @example
			 * {
			 *   title: 'Title',
			 *   name: 'Name',
			 *   prop1: ''
			 *   ...
             *   children: []
             * },
			 *
			 */
			this.itemProperty = function(value){
				itemProperty = value;
			};

			/**
			 * Method to set option which responsible for collapsing all items on start
			 * @param  {[boolean]} value
			 */
			this.collapseAllOnStart = function (value) {
				collapseAllOnStart = value;
			};

			this.activeItemProperty = function (value) {
				activeItemProperty = value;
			};

			this.collapsedItemProperty = function (value) {
				collapsedItemProperty = value;
			};

			/**
			 * Method to set default nestable options
			 * @param  {[object]} value
			 * You can change the follow options:

				maxDepth        : number of levels an item can be nested (default 5)
				group           : group ID to allow dragging between lists (default 0)

				listNodeName    : The HTML element to create for lists (default 'ol')
				itemNodeName    : The HTML element to create for list items (default 'li')
				rootClass       : The class of the root element .nestable() was used on (default 'dd')
				listClass       : The class of all list elements (default 'dd-list')
				itemClass       : The class of all list item elements (default 'dd-item')
				dragClass       : The class applied to the list element that is being dragged (default 'dd-dragel')
				handleClass     : The class of the content element inside each list item (default 'dd-handle')
				collapsedClass  : The class applied to lists that have been collapsed (default 'dd-collapsed')
				placeClass      : The class of the placeholder element (default 'dd-placeholder')
				emptyClass      : The class used for empty list placeholder elements (default 'dd-empty')
				expandBtnHTML   : The HTML text used to generate a list item expand button (default '<button data-action="expand">Expand></button>')
				collapseBtnHTML : The HTML text used to generate a list item collapse button (default '<button data-action="collapse">Collapse</button>')


			 */
			this.defaultOptions = function(value){
				defaultOptions = value;
			};
		})
		.directive('ngNestable', ['$compile', '$filter', '$nestable', function($compile, $filter, $nestable){
			return {
				restrict: 'A',
				require: 'ngModel',
				compile: function(element){
					var itemTemplate = element.html();
					element.empty();
					return function($scope, $element, $attrs, $ngModel){
						var options = $.extend(
							{},
							$nestable.defaultOptions,
							$scope.$eval($attrs.ngNestable)
						);
						options.onExpand = function (item) {
							if ($nestable.collapsedItemProperty) {
								item.data('item')[$nestable.collapsedItemProperty] = false;
							}
						};
						options.onCollapse = function (item) {
							if ($nestable.collapsedItemProperty) {
								item.data('item')[$nestable.collapsedItemProperty] = true;
							}
						};
            var root;
						$scope.$watch(function(){
							return $ngModel.$modelValue;
						}, function(model){
							if(model){

								/**
								 * we are running the formatters here instead of watching on $viewValue because our model is an Array
								 * and angularjs ngModel watcher watches for "shallow" changes and otherwise the possible formatters wouldn't
								 * get executed
								 */
								model = runFormatters(model, $ngModel);
								// TODO: optimize as rebuilding is not necessary here
								root = buildNestableHtml(model, itemTemplate);
								$element.empty().append(root);
								$compile(root)($scope);
								root.nestable(options);
								if ($nestable.collapseAllOnStart) {
									root.nestable('collapseAll');
								}
								root.on('change', function(){
									$ngModel.$setViewValue(root.nestable('serialize'));
									$scope && $scope.$root && $scope.$root.$$phase || $scope.$apply();
								});
							}
						}, true);
            $scope.$on('nestable-expand-all', function ($event) {
              if (root) {
                root.nestable('expandAll');
              }
            });
            $scope.$on('nestable-collapse-all', function ($event) {
              if (root) {
                root.nestable('collapseAll');
              }
            });
          };
				},
				controller: angular.noop
			};

			function buildNestableHtml(model, tpl){
				var root = $('<div class="dd"></div>');
				var rootList = $('<ol class="dd-list"></ol>').appendTo(root);
				if ($nestable.orderBy) {
					model = $filter('orderBy')(model, $nestable.orderBy, $nestable.orderByReverse);
				}
				model.forEach(function f(item){
					var list = Array.prototype.slice.call(arguments).slice(-1)[0];
					if(!(list instanceof $)) list = rootList;

					var listItem = $('<li class="dd-item"></li>');
					var listElement = $('<div ng-nestable-item class="dd-handle"></div>');

					if ($nestable.activeItemProperty) {
							if (item[$nestable.activeItemProperty] === true) {
									listElement.addClass($nestable.defaultOptions.activeItemClass);
							}
					}
					if ($nestable.collapsedItemProperty) {
							if (item[$nestable.collapsedItemProperty] === true) {
									listItem.addClass($nestable.defaultOptions.collapsedClass);
							}
					}

					listElement.append(tpl).appendTo(listItem);
					list.append(listItem);
					var itemData = $nestable.itemProperty ? item[$nestable.itemProperty] : item;
					listItem.data('item', itemData);
					var children = item[$nestable.childrenProperty];
					if ($nestable.childrenFilter) {
						children = $filter('filter')(children, $nestable.childrenFilter);
					}
					if ($nestable.orderBy) {
						children = $filter('orderBy')(children, $nestable.orderBy, $nestable.orderByReverse);
					}
					if(isArray(children) && children.length > 0){
						var subRoot = $('<ol class="dd-list"></ol>').appendTo(listItem);
						children.forEach(function(item){
							f.apply(this, Array.prototype.slice.call(arguments).concat([subRoot]));
						});
					}
				});

				return root;
			}

			function isArray(arr){
				return Object.prototype.toString.call(arr) === '[object Array]';
			}

			function runFormatters(value, ctrl){
				var formatters = ctrl.$formatters,
				idx = formatters.length;

				ctrl.$modelValue = value;
				while(idx--) {
					value = formatters[idx](value);
				}

				return value;
			}
	}])
	.directive('ngNestableItem', ['$nestable', function($nestable){
		return {
			scope: true,
			require: '^ngNestable',
			link: function($scope, $element){
				$scope[$nestable.modelName] = $element.parent().data('item');
			}
		};
	}]);
})(window, document, window.angular);