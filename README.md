# ezserver
lil thing i made to make writing servers quicker
### Install
`npm i -g ezserver`
### Example
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
