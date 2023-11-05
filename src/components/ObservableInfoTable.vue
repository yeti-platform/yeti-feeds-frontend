<template>
  <table class="table is-fullwidth">
    <tbody>
      <tr>
        <th>Sources</th>
        <td>
          <b-taglist>
            <b-tag v-for="source in new Set(observable.context.map(c => c.source))" v-bind:key="source">
              {{ source }}
            </b-tag>
          </b-taglist>
        </td>
      </tr>
      <tr>
        <th>Created</th>
        <td>
          <span :title="'Localtime: ' + formatTimestamp(observable.created, true)"
            >{{ formatTimestamp(observable.created) }} UTC</span
          >
        </td>
      </tr>
    </tbody>

    <tbody v-if="observable.type == 'Hostname'">
      <tr>
        <th>Domain?</th>
        <td>{{ observable.domain ? "Yes" : "No" }}</td>
      </tr>
      <tr>
        <th>IDNA</th>
        <td>{{ observable.idna }}</td>
      </tr>
    </tbody>

    <tbody v-if="observable.type == 'Url'">
      <tr>
        <th>Host</th>
        <td>{{ observable.parsed_url.netloc }}</td>
      </tr>
      <tr>
        <th>Path</th>
        <td>{{ observable.parsed_url.path }}</td>
      </tr>
      <tr>
        <th>Scheme</th>
        <td>{{ observable.parsed_url.scheme }}</td>
      </tr>
      <tr>
        <th>Port</th>
        <td>{{ observable.parsed_url.port }}</td>
      </tr>
    </tbody>

    <tbody v-if="observable.type == 'Ip'">
      <tr>
        <th>IP version</th>
        <td>{{ observable.version }}</td>
      </tr>
      <tr>
        <th>Country</th>
        <td>{{ observable.geoip.country || "N/A" }}</td>
      </tr>
      <tr>
        <th>City</th>
        <td>{{ observable.geoip.city || "N/A" }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import utils from "@/utils";

export default {
  name: "ObservableInfoTable",
  props: ["observable"],
  methods: {
    formatTimestamp(timestamp, local) {
      return utils.formatTimestamp(timestamp, local);
    }
  }
};
</script>
