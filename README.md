# ezserver
lil thing i made to make writing servers quicker
### Install
`npm i -g qezserver`
### Example
(*Note ezserver uses ejs as its templating engine*)
```yml
server:
  port: 3005
  listeningMessage: listening on port @PORT
  views: ./views/
  routes:
    - serve: static
      path: /
      filepath: ./hello.html
    - serve: redirect
      path: /redir
      location: /
    - serve: dynamic
      path: /dynamic
      view: dynamic.ejs
      permissions:
        - process
        - request-query
        - server-yml:server
```
Run `ezserver run <name>.server.yml` or run `ezserver build <name>.server.yml -o out.js` to compile the server.
### Permissions
There are several permissions on ezserver
Here's a list of them
- modules - gives access to the require function
- process - gives access to the process object
- request - gives access to the request object
- response - gives access to the response object
- request-params - gives access to the params object from `req.params`
- request-query - gives access to the query object from `req.query`
- express/app - gives access to the `app` object from express
- server-yml:root - gives you access to the root of the yml server file
- server-yml:server - gives you access to the server key of the yml server file
- filesystem:write - gives access to `writeFileSync` from the `fs` module
- filesystem:read - gives access to `readFileSync` from the `fs` module
### Command line usage
```bash
$ ezserver <run/build> <filename> [-o <outputFilename>]
```