describe("create", function() {

  var create = require('../create');
  var disconnect = require('../disconnect');
  var clone = require('./util/clone');
  var localPath = require('helper').localPath;

  // this prevents an existing bare repo from being clobbered
  it("should fail when called twice", function(done) {

    create(global.blog, function(err){
      
      expect(err).toEqual(null);
      expect(err).not.toEqual(jasmine.any(Error));

      create(global.blog, function(err){
        
        expect(err).not.toEqual(null);
        expect(err).toEqual(jasmine.any(Error));

        done();
      });
    });
  });

  // this prevents an existing bare repo from being clobbered
  // this simulates a user connecting the git client, disconnecting
  // then connecting again..
  it("should not fail when disconnect is called inbetween", function(done) {

    create(global.blog, function(err){
      
      expect(err).toEqual(null);
      expect(err).not.toEqual(jasmine.any(Error));

      disconnect(global.blog.id, function(err){

        expect(err).toEqual(null);
        expect(err).not.toEqual(jasmine.any(Error));

        create(global.blog, function(err){
          
          expect(err).toEqual(null);
          expect(err).not.toEqual(jasmine.any(Error));

          done();
        });
      });      
    });
  });  
  
  it("should fail when there is a repo with an origin in the blog's folder", function(done) {

    var Git = require("simple-git");

    Git = Git(localPath(global.blog.id,'/')).silent(true);
    
    Git.init(function(err){

      expect(err).toEqual(null);

      Git.addRemote('origin', 'http://git.com/foo.git', function(err){

        expect(err).toEqual(null);

        create(global.blog, function(err){
          
          expect(err).not.toEqual(null);
          expect(err).toEqual(jasmine.any(Error));

          done();
        });
      });
    });
  });
  
  it("preserves existing files and folders", function(done) {

    var blogDir = localPath(global.blog.id,'/');
    var fs = require('fs-extra');

    fs.outputFileSync(blogDir + '/first.txt', 'Hello');
    fs.outputFileSync(blogDir + '/Sub Folder/second.txt', 'World');
    fs.outputFileSync(blogDir + '/third', '!');

    create(global.blog, function(err){
      
      expect(err).toEqual(null);

      // Verify files and folders are preserved on Blot's copy of blog folder
      expect(fs.readdirSync(blogDir)).toEqual(['.git', 'Sub Folder', 'first.txt', 'third']);
      expect(fs.readdirSync(blogDir + '/Sub Folder')).toEqual(['second.txt']);

      clone(function(err, clonedDir){

        expect(err).toEqual(null);

        // Verify files and folders are preserved in cloneable folder
        expect(fs.readdirSync(clonedDir)).toEqual(['.git', 'Sub Folder', 'first.txt', 'third']);
        expect(fs.readdirSync(clonedDir + '/Sub Folder')).toEqual(['second.txt']);

        done();
      });
    });
  });

});