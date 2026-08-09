import { SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const frameworkOptions = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Remix", value: "remix" },
  { label: "Astro", value: "astro" },
];
export default function Page() {
  return (
    <div className="mt-6 mx-auto max-w-4xl">
      <h1 className="font-bold text-3xl">Modules</h1>
      <p className="text-muted-foreground">Install modules you need</p>
      <div>
        <InputGroup className="max-w-xl my-4">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search"
            placeholder="Search"
            type="search"
          />
        </InputGroup>
<div className="flex flex-wrap gap-4 mt-6">

        {["Goals", "Quit habits", "Work life balance"].map((skill) => (
          <CardFrame className="w-full max-w-xs">
            <CardFrameHeader>
              <CardFrameTitle>{skill}</CardFrameTitle>
              <CardFrameDescription>
                Deploy your new project in one-click.
              </CardFrameDescription>
            </CardFrameHeader>
            {/* <Card>
            <CardPanel>
              <Form className="flex w-full flex-col gap-4">
                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <Input placeholder="Name of your project" type="text" />
                </Field>
                <Field>
                  <FieldLabel>Framework</FieldLabel>
                  <Select defaultValue="next" items={frameworkOptions}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {frameworkOptions.map(({ label, value }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>
                <Button className="w-full" type="submit">
                  Deploy
                </Button>
              </Form>
            </CardPanel>
          </Card> */}
          </CardFrame>
        ))}
</div>
      </div>
    </div>
  );
}
