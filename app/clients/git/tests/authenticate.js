describe("authenticate", function() {

  // Sets up a temporary test blog and tmp dir
  // which is cleaned up after each test runs
  global.test.blog();
  global.test.tmp();

  // Set up client server to simulate its
  // mounting on the dashboard
  beforeAll(require("./util/startServer"));
  afterAll(require("./util/stopServer"));

  var Git = require("simple-git");
  var repoUrl = require("./util/repoUrl");
  var database = require("../database");
  var createRepo = require('./util/createRepo');
  var clone = require('./util/clone');

  it("allows a user with good credentials to clone a repo", function(done){

    console.log(this.user.uid, this.blog.handle);
    done();
  });

  xit("prevents valid user from accessing other repo", function(done) {
    var badRepo = "other_repo";
    var blog = this.blog;
    var token = this.gitToken;
    var testDataDirectory = require("./util/testDataDirectory");
    var url = repoUrl(blog.handle, token, badRepo);
    var git = Git(testDataDirectory(blog.id)).silent(true);

    git.clone(url, function(err) {
      expect(err).toContain("401 Unauthorized");
      done();
    });
  });

  xit("prevents invalid user from accessing valid repo", function(done) {
    var badHandle = "other_repo";
    var blog = this.blog;
    var token = this.gitToken;
    var url = repoUrl(badHandle, token, blog.handle);
    var testDataDirectory = require("./util/testDataDirectory");
    var git = Git(testDataDirectory(blog.id)).silent(true);

    git.clone(url, function(err) {
      expect(err).toContain("401 Unauthorized");
      done();
    });
  });

  xit("prevents a previously valid user if they refresh their tokens", function(done) {
    var blog = this.blog;

    createRepo(blog, function(err){
      if (err) return done.fail(err);

      clone(blog, function(err, clonedDir){

        if (err) return done.fail(err);

        var git = Git(clonedDir).silent(true);

        database.refreshToken(blog.id, function(err) {
          if (err) return done.fail(err);
          
          git.commit("initial", function(err) {
            if (err) return done.fail(err);
            git.push(function(err) {
              expect(err).not.toEqual(null);
              expect(err).toContain("401 Unauthorized");

              done();
            });
          });
        });
      });
    });
  });


});
