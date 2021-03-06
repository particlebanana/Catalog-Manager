// Create a new export object
var Categories = module.exports;

function error(req, res, err) {
  this.emit('error', { res: res, status: 400, message: err });
}

// GET - Index
Categories.index = function index(req, res) {
  var self = this,
      data,
      html;

  data = {
    category: req.category.slug,
    card: self.slug
  };

  this.category.all(function(err, results) {
    if(err) return error.call(self, req, res, err);

    data.categories = results;
    res.render('category/index', data);
  });
};

// GET - New Form
Categories.form = function form(req, res) {
  var data,
      html;

  data = {
    category: req.category.slug,
    card: this.slug
  };

  res.render('category/new', data);
};

// POST - Create
Categories.create = function create(req, res) {
  var self = this,
      path;

  this.category.create(req.body.category, function(err, result) {
    if(err) return error.call(self, req, res, err);
    path = '/' + req.category.slug + '/' + self.slug + '/categories/' + result.id;

    res.redirect(path);
  });
};

// GET - Show
Categories.show = function show(req, res, params) {
  var self = this,
      data,
      html,
      plugins,
      name,
      pName,
      active;

  data = {
    category: req.category,
    card: this.slug,
    collection: this.collection
  };

  data.active_cards = [];
  data.available_cards = [];

  this.category.get(params.id, function(err, result) {
    if(err) return error.call(self, req, res, err);

    data.result = result;

    Object.keys(self.collection).forEach(function(card) {

      active = false;
      plugins = result.plugins;
      name = self.collection[card].name;

      result.plugins.forEach(function(plugin) {
        pName = Object.keys(plugin)[0];
        if(pName === name) active = true;
      });

      // This category has the card activated
      if(active) {
        data.active_cards.push(self.collection[card]);
      } else {
        data.available_cards.push(self.collection[card]);
      }

    });

    res.render('category/show', data);
  });
};

// GET - Edit Form
Categories.edit = function edit(req, res, params) {
  var self = this,
      data,
      html;

  data = {
    category: req.category.slug,
    card: self.slug
  };

  this.category.get(params.id, function(err, result) {
    if(err) return error.call(self, req, res, err);

    data.result = result;

    res.render('category/edit', data);
  });
};

// PUT - Update
Categories.update = function update(req, res, params) {
  var self = this,
      data,
      action,
      path;

  if (!req.body.category) return next(new Error('Nothing to update'));

  data = req.body.category;

  // Make sure we are only replaced fields included in form
  data.name = data.name || req.category.name;
  data.slug = data.slug || req.category.slug;
  data.published = data.published || req.category.published;
  data.index = data.index || req.category.index;
  data.plugins = data.plugins || req.category.plugins;

  // Ensure published flag is set correctly
  if(typeof data.published === 'string') data.published = data.published === 'true' ? true : false;

  this.category.update(params.id, data, function(err, result) {
    if(err) return error.call(self, req, res, err);
    if(!result) return error.call(self, req, res, new Error('No result returned'));

    // Emit an attach or detach method on an event emitter
    action = result.published === true ? 'attach' : 'detach';
    self.adapters.memory.emit(action, result);

    path = '/' + req.category.slug + '/' + self.slug + '/categories/' + result.id;
    res.redirect(path);
  });
};

// DELETE - Destroy
Categories.destroy = function destroy(req, res, params) {
  var self = this,
      path;

  this.category.destroy(params.id, function(err, result) {
    if(err) return error.call(self, req, res, err);

    self.adapters.memory.emit('detach', params.id);

    path = '/' + req.category.slug + '/' + self.slug + '/categories';
    res.redirect(path);
  });
};