const getHomepage = async (req, res) => {
  return res.render("index.js");
};
module.exports = {
  getHomepage,
}
