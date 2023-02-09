<template>
  <div class="columns" v-if="entity">
    <div class="column is-8">
      <div class="tile is-ancestor">
        <div class="tile is-vertical is-parent">
          <nav class="tile panel is-child">
            <p class="panel-heading">
              <b-taglist attached>
                <b-tag size="is-large" type="is-dark">{{ entity.name }}</b-tag>
                <b-tag size="is-large" type="is-info">{{ entity.type }}</b-tag>
              </b-taglist>
            </p>
            <div class="panel-block">
              <div class="content">{{ entity.description || "No description provided" }}</div>
            </div>
          </nav>
          <div class="tile is-child">
            <b-tabs v-model="activeTab" position="is-left" :animated="false">
              <b-tab-item>
                <template slot="header">
                  <b-icon icon="sitemap"></b-icon>
                  <span>
                    Observables
                    <b-tag rounded> {{ totalRelated == null ? "?" : totalRelated }}</b-tag>
                  </span>
                </template>
                <related-objects
                  source-type="Entity"
                  target-type="Observable"
                  :id="id"
                  @totalUpdated="value => (totalRelated = value)"
                ></related-objects>
              </b-tab-item>
            </b-tabs>
          </div>
        </div>
      </div>
    </div>
    <div class="column">
      <div class="tile is-ancestor">
        <div class="tile is-vertical is-parent">
          <nav class="tile panel is-child">
            <p class="panel-heading">Info</p>
            <div class="panel-block">
              <table class="table is-fullwidth">
                <tbody v-if="entity.type == 'malware'">
                  <tr>
                    <th>Family</th>
                    <td>{{ entity.family }}</td>
                  </tr>
                  <tr>
                    <th>Aliases</th>
                    <td>
                      <b-taglist>
                        <b-tag v-for="alias in entity.aliases" v-bind:key="alias">{{ alias }}</b-tag>
                      </b-taglist>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </nav>
          <nav class="tile panel is-child">
            <p class="panel-heading">Relevant tags</p>
            <div class="panel-block">
              <b-field>
                <yeti-tag-input v-model="entity.tags"></yeti-tag-input>
                <p class="control">
                  <button class="button is-primary" @click="saveTags">Save</button>
                </p>
              </b-field>
            </div>
            <small class="panel-block">Observables tagged with these tags will be linked to this entity.</small>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import YetiTagInput from "@/components/YetiTagInput";
// import RelatedEntities from "@/components/RelatedEntities";
import RelatedObjects from "@/components/RelatedObjects";
// import entityInfoTable from "@/components/entityInfoTable";

// const ENTITY_TYPES = [
//   {
//     name: "Malware",
//     type: "malware",
//     fields: [
//       { field: "name", type: "text", label: "Name" },
//       { field: "tags", type: "list", label: "Tags" },
//       { field: "family", type: "list", label: "Family" },
//       { field: "aliases", type: "list", label: "Aliases" },
//       { field: "description", type: "longtext", label: "Description" }
//     ]
//   }
// ];

export default {
  props: ["id"],
  components: {
    YetiTagInput,
    // RelatedEntities
    RelatedObjects
  },
  data() {
    return {
      entity: null,
      newTags: [],
      activeTab: null,
      totalRelated: null
    };
  },
  mounted() {
    this.getentityDetails();
  },
  methods: {
    getentityDetails() {
      axios
        .get(`/api/entity/${this.id}`)
        .then(response => {
          this.entity = response.data;
          // Switch back to Context view when reloading the page.
          this.activeTab = 0;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    saveTags() {
      var params = {
        tags: this.entity.tags
      };
      axios
        .post(`/api/entity/${this.id}`, params)
        .then(response => {
          this.entity = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    }
  },
  watch: {
    id: "getentityDetails"
  }
};
</script>

<style scoped lang="css"></style>
