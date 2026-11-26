module.exports = {
  run: [{
    method: "fs.rm",
    params: {
      path: "app/env"
    }
  }, {
    when: "{{exists('app/env-rocm')}}",
    method: "fs.rm",
    params: {
      path: "app/env-rocm"
    }
  }, {
    method: "fs.rm",
    params: {
      path: "app/models"
    }
  }]
}
