import DBus from "dbus";

const serviceName = "org.freedesktop.systemd1";
const objectPath = "/org/freedesktop/systemd1";
const interfaceName = "org.freedesktop.systemd1.Manager";

export const DBusError = {
  FileNotFound: "org.freedesktop.DBus.Error.FileNotFound"
};

export async function connect() {
  const system = DBus.getBus("system");

  return new Promise((resolve, reject) => {
    // dynamically load interface from DBus
    system.getInterface(serviceName, objectPath, interfaceName, (err, iface) => {
      // wrap the interface in a Proxy
      if (err) reject(err); else resolve(new Proxy(iface, {
        // intercept property access to interface
        get(target, prop, receiver) {
          // replace methods (functions starting with capital letter)
          if (typeof target[prop] === "function" && /^[A-Z]/.test(prop)) {
            // replace with async function
            return async function (...args) {
              // wrap DBus method in Promise
              return new Promise((resolve, reject) => {
                // pass callback to grab and return results
                target[prop](...args, (err, result) => {
                  if (err) reject(err); else resolve(result);
                });
              });
            };
          }

          // use default implementation for everything else
          else {
            return Reflect.get(...arguments);
          }
        }
      }));
    });
  });
}
