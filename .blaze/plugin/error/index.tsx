import "./error.css";
import { init } from "@blaze";
import { rendering } from "@root/system/core";

export default function withError() {
  return () => {
    let component = new Errors();
    let query = document.body.querySelector("#container-error");
    if (query) {
      query.remove();
    }
    rendering(component, null, true, {}, 0, component.constructor, []);
    document.body.appendChild(component.$node);
    component.$deep.mounted(false);
  };
}

function Errors() {
  this.disableExtension = true;

  const { render, state, computed } = init(this);
  state("", {
    data: {
      title: "",
      message: "",
    },
  });
  computed(() => ({
    method: {
      open: (title, message) => {
        if (import.meta.env.DEV && title !== this.state.data.title) {
          this.state.data = { title, message };
          console.error(message)
        }
      },
      close: () => {
        this.state.data = {
          title: "",
          message: "",
        }
        this.$deep.trigger()
      },
    },
  }));

  window.$error = this;

  render(() => (
    <div id="container-error">
      <div style={this.state.data.title ? "display: flex;" : "display: none;"} id="error">
        <div>
          <div>
            <h5>{this.state.data.title}</h5>
          </div>
          <div class="code">
            <code>{this.state.data.message}</code>
          </div>
          <div>
            <a onClickPrevent={this.close} href="/">Close</a>
          </div>
        </div>
      </div>
    </div>
  ));
}
