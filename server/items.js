// Define the class
class Items {
    constructor(name) {
      this.base_url = name;
    }
  
    fetchItems() {
      return "Base url is, " + this.base_url + "!";
    }
  }
  
  // Export the class
  module.exports = Items;